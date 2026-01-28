import os
import json
import holidays
from datetime import date

# Get the directory of the current file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_FILE = os.path.join(BASE_DIR, 'holidays_india.json')

def get_indian_holidays(year, states=None, include_national=True):
    """
    Fetch holidays using a hybrid approach:
    1. High-accuracy local JSON mirror for main public holidays.
    2. Fallback to 'holidays' library for specific state rules if not in JSON.
    """
    year_str = str(year)
    all_holidays = []
    seen_dates = {} # date: name
    
    # 1. Load from accurate JSON mirror first
    if os.path.exists(JSON_FILE):
        try:
            with open(JSON_FILE, 'r') as f:
                data = json.load(f)
                
            if year_str in data:
                year_data = data[year_str]
                
                # Fetch National
                if include_national:
                    for h in year_data.get('national', []):
                        date_str = f"{year}-{str(h['month']).zfill(2)}-{str(h['day']).zfill(2)}"
                        all_holidays.append({
                            'name': h['name'],
                            'date': date_str,
                            'type': 'public',
                            'description': 'National Holiday'
                        })
                        seen_dates[date_str] = h['name']
                
                # Fetch Regional from JSON if specified
                if states:
                    for state in states:
                        if state in year_data.get('regional', {}):
                            for h in year_data['regional'][state]:
                                date_str = f"{year}-{str(h['month']).zfill(2)}-{str(h['day']).zfill(2)}"
                                if date_str not in seen_dates:
                                    all_holidays.append({
                                        'name': h['name'],
                                        'date': date_str,
                                        'type': 'public',
                                        'description': f"{state} State Holiday"
                                    })
                                    seen_dates[date_str] = h['name']
        except Exception as e:
            print(f"Error reading holiday JSON: {e}")

    # 2. Fallback/Augment with 'holidays' library for missing pieces
    # If the JSON didn't cover everything or we want the library's logic
    try:
        # Fetch library national if include_national is true but somehow JSON failed
        if include_national and not seen_dates:
            lib_hols = holidays.country_holidays('IN', years=year)
            for date_obj, name in lib_hols.items():
                date_str = date_obj.strftime('%Y-%m-%d')
                if date_str not in seen_dates:
                    all_holidays.append({
                        'name': name,
                        'date': date_str,
                        'type': 'public',
                        'description': 'National Holiday'
                    })
                    seen_dates[date_str] = name
                    
        # Fetch library state holidays for any states requested
        if states:
            # Map of full state names to library codes
            STATE_CODE_MAP = {
                'Andhra Pradesh': 'AP', 'Arunachal Pradesh': 'AR', 'Assam': 'AS', 'Bihar': 'BR',
                'Chhattisgarh': 'CT', 'Goa': 'GA', 'Gujarat': 'GJ', 'Haryana': 'HR',
                'Himachal Pradesh': 'HP', 'Jharkhand': 'JH', 'Karnataka': 'KA', 'Kerala': 'KL',
                'Madhya Pradesh': 'MP', 'Maharashtra': 'MH', 'Manipur': 'MN', 'Meghalaya': 'ML',
                'Mizoram': 'MZ', 'Nagaland': 'NL', 'Odisha': 'OR', 'Punjab': 'PB',
                'Rajasthan': 'RJ', 'Sikkim': 'SK', 'Tamil Nadu': 'TN', 'Telangana': 'TG',
                'Tripura': 'TR', 'Uttar Pradesh': 'UP', 'Uttarakhand': 'UT', 'West Bengal': 'WB',
                'Andaman and Nicobar Islands': 'AN', 'Chandigarh': 'CH',
                'Dadra and Nagar Haveli and Daman and Diu': 'DN', 'Delhi': 'DL',
                'Jammu and Kashmir': 'JK', 'Ladakh': 'LA', 'Lakshadweep': 'LD', 'Puducherry': 'PY'
            }
            
            for state_name in states:
                code = STATE_CODE_MAP.get(state_name)
                if code:
                    lib_state_hols = holidays.country_holidays('IN', subdiv=code, years=year)
                    for date_obj, name in lib_state_hols.items():
                        date_str = date_obj.strftime('%Y-%m-%d')
                        if date_str not in seen_dates:
                            all_holidays.append({
                                'name': name,
                                'date': date_str,
                                'type': 'public',
                                'description': f"{state_name} State Holiday"
                            })
                            seen_dates[date_str] = name
    except Exception as e:
        print(f"Error using holidays library: {e}")

    return sorted(all_holidays, key=lambda x: x['date'])
