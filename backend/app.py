from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from model import predict_bankruptcy
from pymongo import MongoClient
from datetime import datetime
import csv
from io import StringIO
import smtplib
from email.mime.text import MIMEText

app = Flask(__name__)
CORS(app)

# MongoDB Atlas URI
client = MongoClient('mongodb+srv://bankruptcy_user:frank1778G@cluster0.wxbr5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
db = client['bankruptcy_db']
predictions_collection = db['predictions']
users_collection = db['users']

# Email configuration
EMAIL_SENDER = 'koechalex142@gmail.com'
EMAIL_PASSWORD = 'mazgugzssfkggvtb'
SMTP_SERVER = 'smtp.gmail.com'
SMTP_PORT = 587

def send_email(to_email, company_name, risk_score, confidence, risk_factors):
    subject = f"Bankruptcy Prediction Alert: {company_name}"
    body = f"""
    Dear User,

    Here is your bankruptcy prediction result:

    Company: {company_name}
    Risk Score: {risk_score}%
    Confidence: {confidence}%
    Risk Factors: {', '.join([f"{k}: {v}" for k, v in risk_factors.items()])}
    Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

    Thank you for using the Bankruptcy Prediction System!

    Regards,
    The Prediction Team
    """
    msg = MIMEText(body)
    msg['Subject'] = subject
    msg['From'] = EMAIL_SENDER
    msg['To'] = to_email

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(EMAIL_SENDER, EMAIL_PASSWORD)
            server.send_message(msg)
        print(f"Email sent successfully to {to_email}")
    except Exception as e:
        print(f"Failed to send email to {to_email}: {str(e)}")

def authenticate_user(email, password):
    user = users_collection.find_one({'email': email, 'password': password})
    return user

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        user = authenticate_user(email, password)
        if user:
            return jsonify({'message': 'Login successful', 'email': user['email'], 'first_name': user['first_name']}), 200
        return jsonify({'error': 'Invalid credentials'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/signup', methods=['POST'])
def signup():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        first_name = data.get('first_name')
        if users_collection.find_one({'email': email}):
            return jsonify({'error': 'User already exists'}), 400
        users_collection.insert_one({'email': email, 'password': password, 'first_name': first_name, 'theme': 'light'}) # Default theme
        return jsonify({'message': 'Signup successful', 'email': email, 'first_name': first_name}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/profile', methods=['GET'])
def get_profile():
    try:
        email = request.args.get('email')
        user = users_collection.find_one({'email': email}, {'_id': 0})
        if not user:
            return jsonify({'error': 'User not found'}), 404
        return jsonify(user), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        data = request.form
        company_name = data.get('company_name')
        user_email = data.get('email', 'guest')
        input_data = {
            'Total Assets': float(data.get('assets', 0)),
            'Total Liabilities': float(data.get('liabilities', 0)),
            'Net Income': float(data.get('net_income', 0)),
            'Cash Flow': float(data.get('cash_flow', 0)),
            'Debt-to-Equity': float(data.get('debt_equity', 0)),
            'Current Ratio': float(data.get('current_ratio', 0)),
            'Revenue': float(data.get('revenue', 0))
        }
        risk_score, confidence, risk_factors = predict_bankruptcy(input_data)
        response = {
            'company_name': company_name,
            'risk_score': risk_score,
            'confidence': confidence,
            'risk_factors': risk_factors,
            'summary': f"{company_name} has a {risk_score}% likelihood of bankruptcy.",
            'input_data': input_data
        }
        prediction_record = {
            'company_name': company_name,
            'user_email': user_email,
            'input_data': input_data,
            'risk_score': risk_score,
            'confidence': confidence,
            'risk_factors': risk_factors,
            'timestamp': datetime.now()
        }
        predictions_collection.insert_one(prediction_record)

        if user_email != 'guest':
            send_email(user_email, company_name, risk_score, confidence, risk_factors)

        return jsonify(response)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/history', methods=['GET'])
def get_history():
    try:
        user_email = request.args.get('user_email', 'guest')
        history = list(predictions_collection.find({'user_email': user_email}).sort('timestamp', -1).limit(10))
        for record in history:
            record['_id'] = str(record['_id'])
        return jsonify(history)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/export', methods=['GET'])
def export_history():
    try:
        user_email = request.args.get('user_email', 'guest')
        history = list(predictions_collection.find({'user_email': user_email}).sort('timestamp', -1))
        for record in history:
            record['_id'] = str(record['_id'])
            record['timestamp'] = record['timestamp'].strftime('%Y-%m-%d %H:%M:%S')
        output = StringIO()
        writer = csv.writer(output)
        headers = ['Company Name', 'Risk Score', 'Confidence', 'Risk Factors', 'Timestamp', 'Total Assets', 'Total Liabilities', 'Net Income', 'Cash Flow', 'Debt-to-Equity', 'Current Ratio', 'Revenue']
        writer.writerow(headers)
        for record in history:
            input_data = record['input_data']
            risk_factors_str = '; '.join([f"{k}: {v}" for k, v in record['risk_factors'].items()])
            row = [
                record['company_name'],
                record['risk_score'],
                record['confidence'],
                risk_factors_str,
                record['timestamp'],
                input_data['Total Assets'],
                input_data['Total Liabilities'],
                input_data['Net Income'],
                input_data['Cash Flow'],
                input_data['Debt-to-Equity'],
                input_data['Current Ratio'],
                input_data['Revenue']
            ]
            writer.writerow(row)
        csv_data = output.getvalue()
        output.close()
        return Response(
            csv_data,
            mimetype='text/csv',
            headers={"Content-Disposition": "attachment;filename=prediction_history.csv"}
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/analytics', methods=['GET'])
def get_analytics():
    try:
        user_email = request.args.get('user_email', 'guest')
        pipeline = [
            {'$match': {'user_email': user_email}},
            {'$group': {
                '_id': {'$dateToString': {'format': '%Y-%m', 'date': '$timestamp'}},
                'total_predictions': {'$sum': 1},
                'avg_risk': {'$avg': '$risk_score'},
                'high_risk_count': {'$sum': {'$cond': [{'$gt': ['$risk_score', 60]}, 1, 0]}}
            }},
            {'$sort': {'_id': 1}}
        ]
        result = list(predictions_collection.aggregate(pipeline))
        overall = {
            'total_predictions': sum(r['total_predictions'] for r in result),
            'avg_risk': sum(r['avg_risk'] * r['total_predictions'] for r in result) / (sum(r['total_predictions'] for r in result) or 1),
            'high_risk_count': sum(r['high_risk_count'] for r in result),
            'monthly_trends': result
        }
        return jsonify(overall), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)