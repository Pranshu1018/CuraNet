from flask import Flask, request, jsonify
from flask_cors import CORS 
import joblib
import numpy as np
import pandas as pd
import os
from rapidfuzz import process

app = Flask(__name__)
CORS(app) 

# --- PATH CONFIGURATION ---
base_path = os.path.dirname(os.path.abspath(__file__))

# Global variables for models and data
model = None
all_symptoms = None
desc_dict = None
prec_dict = None
hospital_df = None

def load_resources():
    global model, all_symptoms, desc_dict, prec_dict, hospital_df
    try:
        # Load ML models and dictionaries
        model = joblib.load(os.path.join(base_path, 'disease_model.pkl'))
        all_symptoms = joblib.load(os.path.join(base_path, 'symptoms_list.pkl'))
        desc_dict = joblib.load(os.path.join(base_path, 'desc_dict.pkl'))
        prec_dict = joblib.load(os.path.join(base_path, 'prec_dict.pkl'))
        
        # Load the 50,000-row hospital dataset
        csv_path = os.path.join(base_path, 'large_hospital_system_dataset.csv')
        hospital_df = pd.read_csv(csv_path)
        print("✅ Successfully loaded all models and hospital data.")
    except Exception as e:
        print(f"❌ CRITICAL ERROR: Could not load data files. {e}")
        hospital_df = pd.DataFrame()

load_resources()

def get_fuzzy_symptoms(user_text):
    """Detects symptoms even with typos."""
    detected = []
    clean_input = user_text.lower().replace(' ', '').replace('_', '')
    for symptom in all_symptoms:
        matches = process.extract(symptom, [clean_input], score_cutoff=85)
        if matches:
            detected.append(symptom)
    return list(set(detected))

@app.route('/chat', methods=['POST'])
def chat():
    user_msg = request.json.get('message', '').lower()
    if hospital_df.empty:
        return jsonify({'reply': "System error: Hospital database not found."})

    latest_time = hospital_df['timestamp'].max()
    now_df = hospital_df[hospital_df['timestamp'] == latest_time].copy()
    reply_parts = []

    # --- 1. SYMPTOM CHECKER & DIAGNOSIS ---
    identified = get_fuzzy_symptoms(user_msg)
    if identified:
        input_vec = np.zeros(len(all_symptoms))
        for s in identified: 
            input_vec[all_symptoms.index(s)] = 1
        
        probs = model.predict_proba([input_vec])[0]
        classes = model.classes_
        top_idx = np.argsort(probs)[::-1]
        
        main_disease = classes[top_idx[0]]
        confidence = int(probs[top_idx[0]] * 100)
        
        diag_text = (f"🔍 **Symptoms Detected:** {', '.join(identified)}\n"
                     f"🩺 **Possible Diagnosis:** {main_disease} ({confidence}% confidence)\n"
                     f"**Details:** {desc_dict.get(main_disease, 'No further details available.')}\n")
        
        precs = prec_dict.get(main_disease, [])
        if precs:
            diag_text += "✅ **Recommended Precautions:**\n- " + "\n- ".join(precs)
        
        reply_parts.append(diag_text)

    # --- 2. HOSPITAL & RESOURCE QUERIES ---
    # Specific: OPD / Patient Load
    if any(k in user_msg for k in ['opd', 'crowd', 'busy', 'waiting', 'patient load']):
        quiet_h = now_df.sort_values(by='patients_waiting').iloc[0]
        reply_parts.append(f"📊 **OPD Update:** Visit **{quiet_h['hospital']}**. It is currently the quietest with {quiet_h['patients_waiting']} patients waiting.")

    # Specific: Doctor Availability
    elif any(k in user_msg for k in ['doctor', 'md', 'specialist', 'physician']):
        doc_h = now_df.sort_values(by='doctors_available', ascending=False).iloc[0]
        reply_parts.append(f"👨‍⚕️ **Staffing Status:** **{doc_h['hospital']}** has the most doctors available right now ({doc_h['doctors_available']} on duty).")

    # Specific: Bed Availability
    elif any(k in user_msg for k in ['bed', 'admit', 'admission', 'ward']):
        now_df['beds_free'] = 100 - now_df['bed_occupancy']
        bed_h = now_df.sort_values(by='beds_free', ascending=False).iloc[0]
        reply_parts.append(f"🛌 **Admission:** **{bed_h['hospital']}** has the highest vacancy ({bed_h['beds_free']:.1f}% beds free).")

    # General: "Best Hospital" recommendation
    elif any(k in user_msg for k in ['hospital', 'best', 'free', 'where', 'clinic', 'apt']):
        top_h = now_df.sort_values(by=['avg_wait_time', 'bed_occupancy']).head(3)
        h_list = "🏥 **Top Recommended Facilities:**\n"
        for i, (_, row) in enumerate(top_h.iterrows(), 1):
            h_list += f"{i}. **{row['hospital']}** (Wait: {row['avg_wait_time']}m | Beds: {100-row['bed_occupancy']:.1f}% free)\n"
        reply_parts.append(h_list)

    # --- 3. FINAL RESPONSE ASSEMBLY ---
    if not reply_parts:
        return jsonify({'reply': "I'm here to help! You can describe your symptoms, ask about 'available doctors', 'OPD status', or find the 'best hospital' currently."})

    return jsonify({'reply': "\n\n---\n\n".join(reply_parts)})

if __name__ == '__main__':
    app.run(port=5000, debug=True)