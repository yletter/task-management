from flask import Flask, request, jsonify
from flask_cors import CORS
from functools import wraps
import mysql.connector
from mysql.connector import pooling
import base64
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# ─── Configuration ───────────────────────────────────────────────────────────

DB_CONFIG = {
    'host': os.environ.get('DB_HOST', 'localhost'),
    'port': int(os.environ.get('DB_PORT', 3306)),
    'user': os.environ.get('DB_USER', 'root'),
    'password': os.environ.get('DB_PASSWORD', 'admin'),
    'database': os.environ.get('DB_NAME', 'task_management'),
}

AUTH_TOKEN = base64.b64encode("Task@2026".encode()).decode()  # "VGFza0AyMDI2"

# Connection pool
connection_pool = pooling.MySQLConnectionPool(
    pool_name="task_pool",
    pool_size=10,
    **DB_CONFIG
)


def get_db():
    return connection_pool.get_connection()


# ─── Auth Decorator ──────────────────────────────────────────────────────────

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('taskauth')
        print(token)
        print("All headers:", dict(request.headers))

        print("---- Incoming Headers ----")
        for header, value in request.headers.items():
            print(f"{header}: {value}")
        print("--------------------------")
        if not token or token != AUTH_TOKEN:
            return jsonify({'error': 'Unauthorized. Invalid or missing task_auth header.'}), 401
        return f(*args, **kwargs)
    return decorated


# ─── Helper: serialize datetime ──────────────────────────────────────────────

def serialize_row(row, columns):
    result = {}
    for col, val in zip(columns, row):
        if isinstance(val, datetime):
            result[col] = val.isoformat()
        else:
            result[col] = val
    return result


# ═══════════════════════════════════════════════════════════════════════════════
#  TASK APIs (1–4)
# ═══════════════════════════════════════════════════════════════════════════════

# API-1: Get all tasks with all details
@app.route('/api/tasks', methods=['GET'])
@require_auth
def get_all_tasks():
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT t.id, t.task_number, t.version, t.description, t.release_type,
                   t.environment, t.planned_date, t.created, t.modified
            FROM task t
            ORDER BY t.created DESC
        """)
        task_columns = [desc[0] for desc in cursor.description]
        tasks = cursor.fetchall()

        result = []
        for task_row in tasks:
            task = serialize_row(task_row, task_columns)

            cursor.execute("""
                SELECT td.id, td.task_id, td.category_id, td.step_number, td.detail,
                       td.owners, td.status, td.completion_time, td.rollback_step,
                       td.rollback_status, td.rollback_time, td.notes, td.created, td.modified,
                       c.name as category_name, c.colour as category_colour
                FROM task_detail td
                LEFT JOIN category c ON td.category_id = c.id
                WHERE td.task_id = %s
                ORDER BY td.step_number
            """, (task['id'],))
            detail_columns = [desc[0] for desc in cursor.description]
            details = cursor.fetchall()
            task['details'] = [serialize_row(d, detail_columns) for d in details]
            result.append(task)

        return jsonify({'success': True, 'data': result}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# API-2: Update a task by task_number
@app.route('/api/tasks/<task_number>', methods=['PUT'])
@require_auth
def update_task(task_number):
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400

    conn = get_db()
    cursor = conn.cursor()
    try:
        # Build dynamic update
        allowed_fields = ['version', 'description', 'release_type', 'environment', 'planned_date']
        updates = []
        values = []
        for field in allowed_fields:
            if field in data:
                updates.append(f"{field} = %s")
                values.append(data[field])

        if not updates:
            return jsonify({'success': False, 'error': 'No valid fields to update'}), 400

        values.append(task_number)
        sql = f"UPDATE task SET {', '.join(updates)} WHERE task_number = %s"
        cursor.execute(sql, values)
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({'success': False, 'error': 'Task not found'}), 404

        return jsonify({'success': True, 'message': 'Task updated successfully'}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# API-3: Delete a task by task_number
@app.route('/api/tasks/<task_number>', methods=['DELETE'])
@require_auth
def delete_task(task_number):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM task WHERE task_number = %s", (task_number,))
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({'success': False, 'error': 'Task not found'}), 404

        return jsonify({'success': True, 'message': 'Task deleted successfully'}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# API-4: Create a new task
@app.route('/api/tasks', methods=['POST'])
@require_auth
def create_task():
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400

    required = ['task_number']
    for field in required:
        if field not in data:
            return jsonify({'success': False, 'error': f'Missing required field: {field}'}), 400

    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO task (task_number, version, description, release_type, environment, planned_date)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            data['task_number'],
            data.get('version'),
            data.get('description'),
            data.get('release_type'),
            data.get('environment'),
            data.get('planned_date')
        ))
        conn.commit()
        new_id = cursor.lastrowid

        return jsonify({'success': True, 'message': 'Task created successfully', 'task_id': new_id}), 201
    except mysql.connector.IntegrityError as e:
        conn.rollback()
        return jsonify({'success': False, 'error': 'Task number already exists'}), 409
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# ═══════════════════════════════════════════════════════════════════════════════
#  TASK DETAIL / STEP APIs (5–9)
# ═══════════════════════════════════════════════════════════════════════════════

# API-5: Get all steps for a given task_number
@app.route('/api/tasks/<task_number>/steps', methods=['GET'])
@require_auth
def get_steps(task_number):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM task WHERE task_number = %s", (task_number,))
        task_row = cursor.fetchone()
        if not task_row:
            return jsonify({'success': False, 'error': 'Task not found'}), 404

        task_id = task_row[0]
        cursor.execute("""
            SELECT td.id, td.task_id, td.category_id, td.step_number, td.detail,
                   td.owners, td.status, td.completion_time, td.rollback_step,
                   td.rollback_status, td.rollback_time, td.notes, td.created, td.modified,
                   c.name as category_name, c.colour as category_colour
            FROM task_detail td
            LEFT JOIN category c ON td.category_id = c.id
            WHERE td.task_id = %s
            ORDER BY td.step_number
        """, (task_id,))
        columns = [desc[0] for desc in cursor.description]
        rows = cursor.fetchall()
        steps = [serialize_row(r, columns) for r in rows]

        return jsonify({'success': True, 'data': steps}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# API-6: Update a step by step_number and task_number
@app.route('/api/tasks/<task_number>/steps/<int:step_number>', methods=['PUT'])
@require_auth
def update_step(task_number, step_number):
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400

    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM task WHERE task_number = %s", (task_number,))
        task_row = cursor.fetchone()
        if not task_row:
            return jsonify({'success': False, 'error': 'Task not found'}), 404
        task_id = task_row[0]

        allowed_fields = ['category_id', 'detail', 'owners', 'status', 'completion_time',
                          'rollback_step', 'rollback_status', 'rollback_time', 'notes']
        updates = []
        values = []
        for field in allowed_fields:
            if field in data:
                updates.append(f"{field} = %s")
                values.append(data[field])

        if not updates:
            return jsonify({'success': False, 'error': 'No valid fields to update'}), 400

        values.extend([task_id, step_number])
        sql = f"UPDATE task_detail SET {', '.join(updates)} WHERE task_id = %s AND step_number = %s"
        cursor.execute(sql, values)
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({'success': False, 'error': 'Step not found'}), 404

        return jsonify({'success': True, 'message': 'Step updated successfully'}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# API-7: Delete a step by step_number and task_number
@app.route('/api/tasks/<task_number>/steps/<int:step_number>', methods=['DELETE'])
@require_auth
def delete_step(task_number, step_number):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM task WHERE task_number = %s", (task_number,))
        task_row = cursor.fetchone()
        if not task_row:
            return jsonify({'success': False, 'error': 'Task not found'}), 404
        task_id = task_row[0]

        cursor.execute("DELETE FROM task_detail WHERE task_id = %s AND step_number = %s", (task_id, step_number))
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({'success': False, 'error': 'Step not found'}), 404

        # Re-order remaining steps
        cursor.execute("""
            SELECT id FROM task_detail WHERE task_id = %s ORDER BY step_number
        """, (task_id,))
        remaining = cursor.fetchall()
        for idx, (detail_id,) in enumerate(remaining, start=1):
            cursor.execute("UPDATE task_detail SET step_number = %s WHERE id = %s", (idx, detail_id))
        conn.commit()

        return jsonify({'success': True, 'message': 'Step deleted and reordered successfully'}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# API-8: Create a new step for a given task_number
@app.route('/api/tasks/<task_number>/steps', methods=['POST'])
@require_auth
def create_step(task_number):
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400

    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM task WHERE task_number = %s", (task_number,))
        task_row = cursor.fetchone()
        if not task_row:
            return jsonify({'success': False, 'error': 'Task not found'}), 404
        task_id = task_row[0]

        # Auto-assign next step_number
        cursor.execute("SELECT COALESCE(MAX(step_number), 0) + 1 FROM task_detail WHERE task_id = %s", (task_id,))
        next_step = cursor.fetchone()[0]

        required = ['category_id']
        for field in required:
            if field not in data:
                return jsonify({'success': False, 'error': f'Missing required field: {field}'}), 400

        cursor.execute("""
            INSERT INTO task_detail (task_id, category_id, step_number, detail, owners, status,
                                     completion_time, rollback_step, rollback_status, rollback_time, notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            task_id,
            data['category_id'],
            next_step,
            data.get('detail'),
            data.get('owners'),
            data.get('status', 'To be done'),
            data.get('completion_time'),
            data.get('rollback_step'),
            data.get('rollback_status', 'To be done'),
            data.get('rollback_time'),
            data.get('notes')
        ))
        conn.commit()

        return jsonify({'success': True, 'message': 'Step created successfully',
                        'step_id': cursor.lastrowid, 'step_number': next_step}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# API-9: Reorder steps for a given task_number
@app.route('/api/tasks/<task_number>/steps/reorder', methods=['PUT'])
@require_auth
def reorder_steps(task_number):
    data = request.get_json()
    if not data or 'order' not in data:
        return jsonify({'success': False, 'error': 'Missing "order" array in body'}), 400

    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM task WHERE task_number = %s", (task_number,))
        task_row = cursor.fetchone()
        if not task_row:
            return jsonify({'success': False, 'error': 'Task not found'}), 404
        task_id = task_row[0]

        order = data['order']  # list of { "step_id": X, "step_number": Y }

        # Use temporary high step numbers to avoid unique constraint conflicts
        offset = 10000
        for item in order:
            cursor.execute("""
                UPDATE task_detail SET step_number = %s WHERE id = %s AND task_id = %s
            """, (item['step_number'] + offset, item['step_id'], task_id))

        for item in order:
            cursor.execute("""
                UPDATE task_detail SET step_number = %s WHERE id = %s AND task_id = %s
            """, (item['step_number'], item['step_id'], task_id))

        conn.commit()
        return jsonify({'success': True, 'message': 'Steps reordered successfully'}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# ═══════════════════════════════════════════════════════════════════════════════
#  CATEGORY APIs (10–13)
# ═══════════════════════════════════════════════════════════════════════════════

# API-10: Get all categories
@app.route('/api/categories', methods=['GET'])
@require_auth
def get_all_categories():
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id, name, colour FROM category ORDER BY name")
        columns = [desc[0] for desc in cursor.description]
        rows = cursor.fetchall()
        categories = [serialize_row(r, columns) for r in rows]
        return jsonify({'success': True, 'data': categories}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# API-11: Update category by id
@app.route('/api/categories/<int:category_id>', methods=['PUT'])
@require_auth
def update_category(category_id):
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400

    conn = get_db()
    cursor = conn.cursor()
    try:
        updates = []
        values = []
        if 'name' in data:
            updates.append("name = %s")
            values.append(data['name'])
        if 'colour' in data:
            updates.append("colour = %s")
            values.append(data['colour'])

        if not updates:
            return jsonify({'success': False, 'error': 'No valid fields to update'}), 400

        values.append(category_id)
        sql = f"UPDATE category SET {', '.join(updates)} WHERE id = %s"
        cursor.execute(sql, values)
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({'success': False, 'error': 'Category not found'}), 404

        return jsonify({'success': True, 'message': 'Category updated successfully'}), 200
    except mysql.connector.IntegrityError:
        conn.rollback()
        return jsonify({'success': False, 'error': 'Category name already exists'}), 409
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# API-12: Delete category by id
@app.route('/api/categories/<int:category_id>', methods=['DELETE'])
@require_auth
def delete_category(category_id):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM category WHERE id = %s", (category_id,))
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({'success': False, 'error': 'Category not found'}), 404

        return jsonify({'success': True, 'message': 'Category deleted successfully'}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# API-13: Create a new category
@app.route('/api/categories', methods=['POST'])
@require_auth
def create_category():
    data = request.get_json()
    if not data or 'name' not in data or 'colour' not in data:
        return jsonify({'success': False, 'error': 'Missing required fields: name, colour'}), 400

    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO category (name, colour) VALUES (%s, %s)", (data['name'], data['colour']))
        conn.commit()
        return jsonify({'success': True, 'message': 'Category created successfully',
                        'category_id': cursor.lastrowid}), 201
    except mysql.connector.IntegrityError:
        conn.rollback()
        return jsonify({'success': False, 'error': 'Category name already exists'}), 409
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# ─── Run ──────────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
