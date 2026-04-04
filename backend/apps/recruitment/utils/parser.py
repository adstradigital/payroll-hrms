import re
import io
import logging
from pdfminer.high_level import extract_text

logger = logging.getLogger(__name__)

def parse_resume(file_obj):
    """
    Extracts text from a PDF file object and parses basic information.
    Handles Django UploadedFile objects by wrapping them in BytesIO if needed.
    """
    try:
        # Some file objects might need to be wrapped or reset
        if hasattr(file_obj, 'seek'):
            file_obj.seek(0)
            
        # Extract text from PDF
        # We wrap in BytesIO to ensure pdfminer can handle the stream correctly
        content = file_obj.read()
        text = extract_text(io.BytesIO(content))
        
        if not text:
            logger.warning(f"No text extracted from resume: {getattr(file_obj, 'name', 'unknown')}")
            return None
            
        # Clean text
        text = text.replace('\n', ' ').replace('\r', ' ')
        # Remove multiple spaces
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Extract Email
        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        emails = re.findall(email_pattern, text)
        email = emails[0] if emails else ""
        
        # Extract Phone
        phone_pattern = r'(\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9})'
        phones = re.findall(phone_pattern, text)
        # Filter for likely phone numbers (must have at least 10 digits)
        phones = [p for p in phones if len(re.sub(r'\D', '', p)) >= 10]
        phone = phones[0] if phones else ""
        
        # Extract Name 
        # Skip common resume headers
        skip_words = {'resume', 'cv', 'curriculum', 'vitae', 'profile', 'contact', 'information'}
        name = "Unknown Candidate"
        words = text.split()
        
        candidate_words = []
        for word in words:
            clean_word = re.sub(r'[^a-zA-Z]', '', word).lower()
            if clean_word and clean_word not in skip_words:
                candidate_words.append(word)
                if len(candidate_words) >= 2:
                    break
        
        if len(candidate_words) >= 2:
            # Basic validation: names usually don't have digits or many symbols
            potential_name = f"{candidate_words[0]} {candidate_words[1]}"
            if not any(char.isdigit() for char in potential_name):
                name = potential_name
            
        # Common skills to look for
        common_skills = [
            'Python', 'Java', 'JavaScript', 'React', 'Node', 'Django', 'PostgreSQL', 
            'AWS', 'Docker', 'Kubernetes', 'Project Management', 'Data Analysis',
            'SQL', 'Excel', 'Communication', 'Teamwork', 'Leadership', 'TypeScript',
            'C++', 'C#', 'PHP', 'Ruby', 'Swift', 'Go', 'Flutter', 'Angular', 'Vue'
        ]
        
        found_skills = []
        lower_text = text.lower()
        for skill in common_skills:
            # Use word boundaries for better matching accuracy
            pattern = r'\b' + re.escape(skill.lower()) + r'\b'
            if re.search(pattern, lower_text):
                found_skills.append(skill)
                
        return {
            'name': name,
            'email': email,
            'phone': phone,
            'skills': ', '.join(found_skills),
            'raw_text': text[:2000] # Save a larger snippet for debug if needed
        }
        
    except Exception as e:
        logger.error(f"Error parsing resume: {str(e)}", exc_info=True)
        return None
