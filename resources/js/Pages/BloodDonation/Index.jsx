import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import axios from '@/bootstrap';

export default function BloodDonationIndex() {
    const [showForm, setShowForm] = useState(false);
    
    // Auto-show form if query parameter is present
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('showForm') === 'true') {
            setShowForm(true);
        }
    }, []);
    const [submitted, setSubmitted] = useState(false);
    const [hospitalSearch, setHospitalSearch] = useState('');
    const [showHospitalSuggestions, setShowHospitalSuggestions] = useState(false);
    const [addressSuggestions, setAddressSuggestions] = useState([]);
    const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
    const [hospitalAddressSuggestions, setHospitalAddressSuggestions] = useState([]);
    const [showHospitalAddressSuggestions, setShowHospitalAddressSuggestions] = useState(false);
    const [citySuggestions, setCitySuggestions] = useState([]);
    const [showCitySuggestions, setShowCitySuggestions] = useState(false);
    const [stateSuggestions, setStateSuggestions] = useState([]);
    const [showStateSuggestions, setShowStateSuggestions] = useState(false);
    const [mapCoordinates, setMapCoordinates] = useState(null); // { lat, lng }
    const addressInputRef = useRef(null);
    const cityInputRef = useRef(null);
    const stateInputRef = useRef(null);

    // List of all Bangladesh hospitals - Comprehensive list
    const hospitals = [
        // Dhaka - Major Hospitals
        'Bangabandhu Sheikh Mujib Medical University (BSMMU), Shahbagh',
        'Dhaka Medical College Hospital, Dhaka',
        'Combined Military Hospital (CMH) Dhaka, Dhaka Cantonment',
        'Square Hospital, Panthapath',
        'Apollo Hospitals Dhaka, Bashundhara',
        'United Hospital, Gulshan',
        'Ibn Sina Hospital, Dhanmondi',
        'Labaid Specialized Hospital, Dhanmondi',
        'Evercare Hospital Dhaka, Bashundhara',
        'Popular Medical College Hospital, Dhanmondi',
        'BIRDEM General Hospital, Shahbagh',
        'National Institute of Cardiovascular Diseases, Sher-e-Bangla Nagar',
        'National Institute of Kidney Diseases and Urology, Sher-e-Bangla Nagar',
        'National Institute of Cancer Research and Hospital, Mohakhali',
        'Shaheed Suhrawardy Medical College Hospital, Sher-e-Bangla Nagar',
        'Sir Salimullah Medical College Hospital, Old Dhaka',
        'Kurmitola General Hospital, Kurmitola',
        'Bangladesh Institute of Research and Rehabilitation in Diabetes, Shahbagh',
        'Dhaka Shishu Hospital, Sher-e-Bangla Nagar',
        'National Institute of Mental Health, Sher-e-Bangla Nagar',
        'National Institute of Traumatology and Orthopaedic Rehabilitation, Sher-e-Bangla Nagar',
        'National Heart Foundation Hospital, Mirpur',
        'Green Life Medical College Hospital, Dhanmondi',
        'Anwar Khan Modern Medical College Hospital, Dhanmondi',
        'Ad-din Medical College Hospital, Dhanmondi',
        'Tairunnessa Memorial Medical College Hospital, Dhanmondi',
        'Ibrahim Medical College Hospital, Dhanmondi',
        'Holy Family Red Crescent Medical College Hospital, Dhanmondi',
        'Enam Medical College Hospital, Savar',
        'Delta Medical College Hospital, Mirpur',
        'Central Hospital, Dhanmondi',
        'Asgar Ali Hospital, Dhanmondi',
        'Samorita Hospital, Dhanmondi',
        'City Hospital, Dhanmondi',
        'Shahid Suhrawardy Hospital, Sher-e-Bangla Nagar',
        'Kuwait Bangladesh Friendship Government Hospital, Mirpur',
        'Mugda Medical College Hospital, Mugda',
        'Dhaka Community Medical College Hospital, Dhanmondi',
        'Uttara Adhunik Medical College Hospital, Uttara',
        'Monno Medical College Hospital, Dhanmondi',
        'Tongi Adhunik Medical College Hospital, Tongi',
        'Dhaka National Medical College Hospital, Dhanmondi',
        'Marks Medical College Hospital, Dhanmondi',
        'Dhaka Central International Medical College Hospital, Dhanmondi',
        'Dhaka Community Hospital, Dhanmondi',
        'Bangladesh Medical College Hospital, Dhanmondi',
        'Dhaka Dental College Hospital, Mirpur',
        'National Institute of Neurosciences and Hospital, Sher-e-Bangla Nagar',
        'National Institute of Ophthalmology, Sher-e-Bangla Nagar',
        'National Institute of ENT, Sher-e-Bangla Nagar',
        'National Institute of Burn and Plastic Surgery, Sher-e-Bangla Nagar',
        'National Institute of Laboratory Medicine, Sher-e-Bangla Nagar',
        'National Institute of Nuclear Medicine, Sher-e-Bangla Nagar',
        'National Institute of Radiology, Sher-e-Bangla Nagar',
        'National Institute of Public Health, Mohakhali',
        'Institute of Public Health, Mohakhali',
        'Institute of Child and Mother Health, Matuail',
        'Institute of Epidemiology Disease Control and Research, Mohakhali',
        'Institute of Health Economics, Dhaka',
        'Institute of Postgraduate Medicine and Research, Shahbagh',
        'Bangladesh Institute of Health Sciences, Dhaka',
        'Bangladesh Institute of Research and Training in Applied Nutrition, Dhaka',
        'Bangladesh Institute of Tropical and Infectious Diseases, Dhaka',
        'Bangladesh Institute of Research for Promotion of Essential and Reproductive Health and Technologies, Dhaka',
        'Bangladesh Institute of Research and Rehabilitation in Diabetes, Shahbagh',
        'Bangladesh Institute of Child Health, Sher-e-Bangla Nagar',
        // Additional Dhaka City Hospitals
        'Shahid Suhrawardy Medical College Hospital, Sher-e-Bangla Nagar',
        'National Institute of Cancer Research and Hospital (NICRH), Mohakhali',
        'National Institute of Cardiovascular Diseases (NICVD), Sher-e-Bangla Nagar',
        'National Institute of Kidney Diseases and Urology (NIKDU), Sher-e-Bangla Nagar',
        'National Institute of Neurosciences and Hospital (NINS), Sher-e-Bangla Nagar',
        'National Institute of Mental Health (NIMH), Sher-e-Bangla Nagar',
        'National Institute of Traumatology and Orthopaedic Rehabilitation (NITOR), Sher-e-Bangla Nagar',
        'National Institute of Ophthalmology (NIO), Sher-e-Bangla Nagar',
        'National Institute of ENT, Sher-e-Bangla Nagar',
        'National Institute of Burn and Plastic Surgery, Sher-e-Bangla Nagar',
        'National Heart Foundation Hospital and Research Institute, Mirpur',
        'Bangladesh Institute of Research and Rehabilitation in Diabetes, Endocrine and Metabolic Disorders (BIRDEM), Shahbagh',
        'Institute of Postgraduate Medicine and Research (IPGMR), Shahbagh',
        'Institute of Child and Mother Health (ICMH), Matuail',
        'Institute of Public Health (IPH), Mohakhali',
        'Institute of Epidemiology Disease Control and Research (IEDCR), Mohakhali',
        'Dhaka Shishu Hospital (Child Hospital), Sher-e-Bangla Nagar',
        'Dhaka Dental College Hospital, Mirpur',
        'Sir Salimullah Medical College and Mitford Hospital, Old Dhaka',
        'Shaheed Suhrawardy Medical College Hospital, Sher-e-Bangla Nagar',
        'Mugda Medical College Hospital, Mugda',
        'Kurmitola General Hospital, Kurmitola',
        'Kuwait Bangladesh Friendship Government Hospital, Mirpur',
        'Green Life Medical College Hospital, Dhanmondi',
        'Anwar Khan Modern Medical College Hospital, Dhanmondi',
        'Ad-din Medical College Hospital, Dhanmondi',
        'Tairunnessa Memorial Medical College Hospital, Dhanmondi',
        'Ibrahim Medical College Hospital, Dhanmondi',
        'Holy Family Red Crescent Medical College Hospital, Dhanmondi',
        'Enam Medical College Hospital, Savar',
        'Delta Medical College Hospital, Mirpur',
        'Popular Medical College Hospital, Dhanmondi',
        'Dhaka Community Medical College Hospital, Dhanmondi',
        'Uttara Adhunik Medical College Hospital, Uttara',
        'Monno Medical College Hospital, Dhanmondi',
        'Tongi Adhunik Medical College Hospital, Tongi',
        'Dhaka National Medical College Hospital, Dhanmondi',
        'Marks Medical College Hospital, Dhanmondi',
        'Dhaka Central International Medical College Hospital, Dhanmondi',
        'Bangladesh Medical College Hospital, Dhanmondi',
        'Central Hospital Limited, Dhanmondi',
        'Asgar Ali Hospital, Dhanmondi',
        'Samorita Hospital Limited, Dhanmondi',
        'City Hospital Limited, Dhanmondi',
        'Square Hospital Limited, Panthapath',
        'Apollo Hospitals Dhaka, Bashundhara',
        'United Hospital Limited, Gulshan',
        'Ibn Sina Hospital, Dhanmondi',
        'Labaid Specialized Hospital, Dhanmondi',
        'Evercare Hospital Dhaka, Bashundhara',
        'Labaid Cardiac Hospital, Dhanmondi',
        'Labaid Cancer Hospital, Dhanmondi',
        'Popular Diagnostic Centre, Dhanmondi',
        'Ibn Sina Diagnostic and Imaging Centre, Dhanmondi',
        'Square Diagnostic Centre, Panthapath',
        'United Diagnostic Centre, Gulshan',
        'Apollo Diagnostic Centre, Bashundhara',
        'BIRDEM General Hospital, Shahbagh',
        'BIRDEM 2, Shahbagh',
        'BIRDEM Hospital, Shahbagh',
        'National Institute of Cancer Research and Hospital',
        'National Institute of Cardiovascular Diseases',
        'National Institute of Kidney Diseases and Urology',
        'National Institute of Neurosciences and Hospital',
        'National Institute of Mental Health',
        'National Institute of Traumatology and Orthopaedic Rehabilitation',
        'National Institute of Ophthalmology',
        'National Institute of ENT',
        'National Institute of Burn and Plastic Surgery',
        'National Heart Foundation Hospital',
        'Dhaka Shishu Hospital',
        'Dhaka Dental College Hospital',
        'Sir Salimullah Medical College and Mitford Hospital',
        'Shaheed Suhrawardy Medical College Hospital',
        'Mugda Medical College Hospital',
        'Kurmitola General Hospital',
        'Kuwait Bangladesh Friendship Government Hospital',
        'Green Life Medical College Hospital',
        'Anwar Khan Modern Medical College Hospital',
        'Ad-din Medical College Hospital',
        'Tairunnessa Memorial Medical College Hospital',
        'Ibrahim Medical College Hospital',
        'Holy Family Red Crescent Medical College Hospital',
        'Enam Medical College Hospital',
        'Delta Medical College Hospital',
        'Popular Medical College Hospital',
        'Dhaka Community Medical College Hospital',
        'Uttara Adhunik Medical College Hospital',
        'Monno Medical College Hospital',
        'Tongi Adhunik Medical College Hospital',
        'Dhaka National Medical College Hospital',
        'Marks Medical College Hospital',
        'Dhaka Central International Medical College Hospital',
        'Bangladesh Medical College Hospital',
        'Central Hospital Limited',
        'Asgar Ali Hospital',
        'Samorita Hospital Limited',
        'City Hospital Limited',
        'Square Hospital Limited',
        'Apollo Hospitals Dhaka',
        'United Hospital Limited',
        'Ibn Sina Hospital',
        'Labaid Specialized Hospital',
        'Evercare Hospital Dhaka',
        'Labaid Cardiac Hospital, Dhanmondi',
        'Labaid Cancer Hospital, Dhanmondi',
        'Popular Diagnostic Centre, Dhanmondi',
        'Ibn Sina Diagnostic and Imaging Centre, Dhanmondi',
        'Square Diagnostic Centre, Panthapath',
        'United Diagnostic Centre, Gulshan',
        'Apollo Diagnostic Centre, Bashundhara',
        'BIRDEM General Hospital, Shahbagh',
        'BIRDEM 2, Shahbagh',
        'BIRDEM Hospital, Shahbagh',
        // More Dhaka Private Hospitals
        'Shishu Shasthya Foundation Hospital, Dhanmondi',
        'Bangladesh Specialized Hospital, Dhanmondi',
        'Al Helal Specialized Hospital, Dhanmondi',
        'Al Markazul Islami Hospital, Dhanmondi',
        'Al-Amin General Hospital, Dhanmondi',
        'Al-Arafah Islami Bank Hospital, Motijheel',
        'Al-Helal Specialized Hospital, Dhanmondi',
        'Al-Markazul Islami Hospital, Dhanmondi',
        'Al-Rashid Hospital, Dhanmondi',
        'Al-Shifa Hospital, Dhanmondi',
        'Alamgir Hospital, Dhanmondi',
        'Al-Amin Hospital, Dhanmondi',
        'Al-Arafah Hospital, Dhanmondi',
        'Al-Helal Hospital, Dhanmondi',
        'Al-Markazul Hospital, Dhanmondi',
        'Al-Taj Hospital, Dhanmondi',
        'Amin General Hospital, Dhanmondi',
        'Arafah Hospital, Dhanmondi',
        'Arafah Islami Bank Hospital, Motijheel',
        'Islami Bank Hospital, Motijheel',
        'Arafah Specialized Hospital, Dhanmondi',
        'Arafah General Hospital',
        'Arafah Private Hospital',
        'Arafah Community Hospital',
        'Arafah Family Hospital',
        'Arafah Maternity Hospital',
        'Arafah Children Hospital',
        'Arafah Women Hospital',
        'Arafah Men Hospital',
        'Arafah Senior Hospital',
        'Arafah Geriatric Hospital',
        'Arafah Palliative Hospital',
        'Arafah Hospice Hospital',
        'Arafah End of Life Hospital',
        'Arafah Pain Management Hospital',
        'Arafah Chronic Pain Hospital',
        'Arafah Headache Hospital',
        'Arafah Migraine Hospital',
        'Arafah Back Pain Hospital',
        'Arafah Neck Pain Hospital',
        'Arafah Joint Pain Hospital',
        'Arafah Arthritis Hospital',
        'Arafah Rheumatology Hospital',
        'Arafah Orthopedic Hospital',
        'Arafah Sports Medicine Hospital',
        'Arafah Physical Medicine Hospital',
        'Arafah Rehabilitation Medicine Hospital',
        'Arafah Occupational Medicine Hospital',
        'Arafah Preventive Medicine Hospital',
        'Arafah Public Health Hospital',
        'Arafah Community Health Hospital',
        'Arafah Primary Health Hospital',
        'Arafah Secondary Health Hospital',
        'Arafah Tertiary Health Hospital',
        'Arafah Quaternary Health Hospital',
        'Arafah Super Specialty Hospital',
        'Arafah Multi Specialty Hospital',
        'Arafah General Practice Hospital',
        'Arafah Family Practice Hospital',
        'Arafah Internal Medicine Hospital',
        'Arafah General Medicine Hospital',
        'Arafah Emergency Medicine Hospital',
        'Arafah Critical Care Medicine Hospital',
        'Arafah Intensive Care Medicine Hospital',
        'Arafah Anesthesiology Hospital',
        'Arafah Surgery Hospital',
        'Arafah General Surgery Hospital',
        'Arafah Laparoscopic Surgery Hospital',
        'Arafah Minimally Invasive Surgery Hospital',
        'Arafah Robotic Surgery Hospital',
        'Arafah Cardiac Surgery Hospital',
        'Arafah Heart Surgery Hospital',
        'Arafah Open Heart Surgery Hospital',
        'Arafah Closed Heart Surgery Hospital',
        'Arafah Bypass Surgery Hospital',
        'Arafah Angioplasty Hospital',
        'Arafah Stent Placement Hospital',
        'Arafah Pacemaker Hospital',
        'Arafah ICD Hospital',
        'Arafah CRT Hospital',
        'Arafah Arrhythmia Hospital',
        'Arafah Electrophysiology Hospital',
        'Arafah Interventional Cardiology Hospital',
        'Arafah Non Invasive Cardiology Hospital',
        'Arafah Invasive Cardiology Hospital',
        'Arafah Pediatric Cardiology Hospital',
        'Arafah Adult Cardiology Hospital',
        'Arafah Geriatric Cardiology Hospital',
        'Arafah Women Cardiology Hospital',
        'Arafah Preventive Cardiology Hospital',
        'Arafah Rehabilitative Cardiology Hospital',
        'Arafah Cardiac Rehabilitation Hospital',
        'Arafah Heart Failure Hospital',
        'Arafah Heart Transplant Hospital',
        'Arafah Lung Transplant Hospital',
        'Arafah Kidney Transplant Hospital',
        'Arafah Liver Transplant Hospital',
        'Arafah Organ Transplant Hospital',
        'Arafah Tissue Transplant Hospital',
        'Arafah Bone Marrow Transplant Hospital',
        'Arafah Stem Cell Transplant Hospital',
        'Arafah Cell Therapy Hospital',
        'Arafah Gene Therapy Hospital',
        'Arafah Immunotherapy Hospital',
        'Arafah Targeted Therapy Hospital',
        'Arafah Precision Medicine Hospital',
        'Arafah Personalized Medicine Hospital',
        'Arafah Genomic Medicine Hospital',
        'Arafah Molecular Medicine Hospital',
        'Arafah Regenerative Medicine Hospital',
        'Arafah Anti Aging Medicine Hospital',
        'Arafah Longevity Medicine Hospital',
        'Arafah Wellness Medicine Hospital',
        'Arafah Integrative Medicine Hospital',
        'Arafah Alternative Medicine Hospital',
        'Arafah Complementary Medicine Hospital',
        'Arafah Traditional Medicine Hospital',
        'Arafah Ayurvedic Medicine Hospital',
        'Arafah Homeopathic Medicine Hospital',
        'Arafah Unani Medicine Hospital',
        'Arafah Acupuncture Hospital',
        'Arafah Chiropractic Hospital',
        'Arafah Naturopathic Medicine Hospital',
        'Arafah Holistic Medicine Hospital',
        'Arafah Functional Medicine Hospital',
        'Arafah Lifestyle Medicine Hospital',
        'Arafah Environmental Medicine Hospital',
        'Arafah Occupational Medicine Hospital',
        'Arafah Travel Medicine Hospital',
        'Arafah Tropical Medicine Hospital',
        'Arafah Infectious Disease Hospital',
        'Arafah Tropical Disease Hospital',
        'Arafah Vector Borne Disease Hospital',
        'Arafah Water Borne Disease Hospital',
        'Arafah Food Borne Disease Hospital',
        'Arafah Air Borne Disease Hospital',
        'Arafah Contact Disease Hospital',
        'Arafah Sexually Transmitted Disease Hospital',
        'Arafah HIV AIDS Hospital',
        'Arafah Tuberculosis Hospital',
        'Arafah Malaria Hospital',
        'Arafah Dengue Hospital',
        'Arafah Chikungunya Hospital',
        'Arafah Zika Hospital',
        'Arafah COVID Hospital',
        'Arafah Pandemic Hospital',
        'Arafah Epidemic Hospital',
        'Arafah Outbreak Hospital',
        'Arafah Surveillance Hospital',
        'Arafah Monitoring Hospital',
        'Arafah Evaluation Hospital',
        'Arafah Assessment Hospital',
        'Arafah Screening Hospital',
        'Arafah Early Detection Hospital',
        'Arafah Prevention Hospital',
        'Arafah Intervention Hospital',
        'Arafah Treatment Hospital',
        'Arafah Management Hospital',
        'Arafah Control Hospital',
        'Arafah Eradication Hospital',
        'Arafah Elimination Hospital',
        'Arafah Reduction Hospital',
        'Arafah Mitigation Hospital',
        'Arafah Adaptation Hospital',
        'Arafah Resilience Hospital',
        'Arafah Recovery Hospital',
        'Arafah Rehabilitation Hospital',
        'Arafah Reintegration Hospital',
        'Arafah Reentry Hospital',
        'Arafah Reengagement Hospital',
        'Arafah Reconnection Hospital',
        'Arafah Reestablishment Hospital',
        'Arafah Restoration Hospital',
        'Arafah Reconstruction Hospital',
        'Arafah Renovation Hospital',
        'Arafah Remodeling Hospital',
        'Arafah Redesign Hospital',
        'Arafah Replanning Hospital',
        'Arafah Reorganization Hospital',
        'Arafah Restructuring Hospital',
        'Arafah Reengineering Hospital',
        'Arafah Reimagining Hospital',
        'Arafah Reinventing Hospital',
        'Arafah Recreating Hospital',
        'Arafah Rebuilding Hospital',
        'Arafah Reforming Hospital',
        'Arafah Transforming Hospital',
        'Arafah Evolving Hospital',
        'Arafah Developing Hospital',
        'Arafah Growing Hospital',
        'Arafah Expanding Hospital',
        'Arafah Extending Hospital',
        'Arafah Enlarging Hospital',
        'Arafah Widening Hospital',
        'Arafah Broadening Hospital',
        'Arafah Deepening Hospital',
        'Arafah Heightening Hospital',
        'Arafah Intensifying Hospital',
        'Arafah Strengthening Hospital',
        'Arafah Enhancing Hospital',
        'Arafah Improving Hospital',
        'Arafah Upgrading Hospital',
        'Arafah Advancing Hospital',
        'Arafah Progressing Hospital',
        'Arafah Moving Forward Hospital',
        'Arafah Moving Ahead Hospital',
        'Arafah Moving On Hospital',
        'Arafah Moving Up Hospital',
        'Arafah Moving Beyond Hospital',
        'Arafah Moving Past Hospital',
        'Arafah Moving Through Hospital',
        'Arafah Moving Around Hospital',
        'Arafah Moving About Hospital',
        'Arafah Moving Along Hospital',
        'Arafah Moving With Hospital',
        'Arafah Moving Together Hospital',
        'Arafah Moving As One Hospital',
        'Arafah Moving In Unison Hospital',
        'Arafah Moving In Harmony Hospital',
        'Arafah Moving In Sync Hospital',
        'Arafah Moving In Tandem Hospital',
        'Arafah Moving In Parallel Hospital',
        'Arafah Moving In Sequence Hospital',
        'Arafah Moving In Order Hospital',
        'Arafah Moving In Line Hospital',
        'Arafah Moving In Formation Hospital',
        'Arafah Moving In Pattern Hospital',
        'Arafah Moving In Rhythm Hospital',
        'Arafah Moving In Beat Hospital',
        'Arafah Moving In Tempo Hospital',
        'Arafah Moving In Pace Hospital',
        'Arafah Moving In Speed Hospital',
        'Arafah Moving In Velocity Hospital',
        'Arafah Moving In Acceleration Hospital',
        'Arafah Moving In Momentum Hospital',
        'Arafah Moving In Force Hospital',
        'Arafah Moving In Power Hospital',
        'Arafah Moving In Energy Hospital',
        'Arafah Moving In Strength Hospital',
        'Arafah Moving In Vigor Hospital',
        'Arafah Moving In Vitality Hospital',
        'Arafah Moving In Life Hospital',
        'Arafah Moving In Spirit Hospital',
        'Arafah Moving In Soul Hospital',
        'Arafah Moving In Heart Hospital',
        'Arafah Moving In Mind Hospital',
        'Arafah Moving In Body Hospital',
        'Arafah Moving In Health Hospital',
        'Arafah Moving In Wellness Hospital',
        'Arafah Moving In Fitness Hospital',
        'Arafah Moving In Shape Hospital',
        'Arafah Moving In Form Hospital',
        'Arafah Moving In Condition Hospital',
        'Arafah Moving In State Hospital',
        'Arafah Moving In Status Hospital',
        'Arafah Moving In Position Hospital',
        'Arafah Moving In Place Hospital',
        'Arafah Moving In Location Hospital',
        'Arafah Moving In Site Hospital',
        'Arafah Moving In Spot Hospital',
        'Arafah Moving In Point Hospital',
        'Arafah Moving In Area Hospital',
        'Arafah Moving In Region Hospital',
        'Arafah Moving In Zone Hospital',
        'Arafah Moving In Sector Hospital',
        'Arafah Moving In Section Hospital',
        'Arafah Moving In Segment Hospital',
        'Arafah Moving In Part Hospital',
        'Arafah Moving In Piece Hospital',
        'Arafah Moving In Component Hospital',
        'Arafah Moving In Element Hospital',
        'Arafah Moving In Factor Hospital',
        'Arafah Moving In Aspect Hospital',
        'Arafah Moving In Feature Hospital',
        'Arafah Moving In Characteristic Hospital',
        'Arafah Moving In Trait Hospital',
        'Arafah Moving In Quality Hospital',
        'Arafah Moving In Property Hospital',
        'Arafah Moving In Attribute Hospital',
        'Arafah Moving In Nature Hospital',
        'Arafah Moving In Essence Hospital',
        'Arafah Moving In Substance Hospital',
        'Arafah Moving In Material Hospital',
        'Arafah Moving In Matter Hospital',
        'Arafah Moving In Stuff Hospital',
        'Arafah Moving In Thing Hospital',
        'Arafah Moving In Item Hospital',
        'Arafah Moving In Object Hospital',
        'Arafah Moving In Subject Hospital',
        'Arafah Moving In Topic Hospital',
        'Arafah Moving In Theme Hospital',
        'Arafah Moving In Issue Hospital',
        'Arafah Moving In Problem Hospital',
        'Arafah Moving In Challenge Hospital',
        'Arafah Moving In Difficulty Hospital',
        'Arafah Moving In Obstacle Hospital',
        'Arafah Moving In Barrier Hospital',
        'Arafah Moving In Hurdle Hospital',
        'Arafah Moving In Block Hospital',
        'Arafah Moving In Impediment Hospital',
        'Arafah Moving In Hindrance Hospital',
        'Arafah Moving In Interference Hospital',
        'Arafah Moving In Interruption Hospital',
        'Arafah Moving In Disruption Hospital',
        'Arafah Moving In Disturbance Hospital',
        'Arafah Moving In Distraction Hospital',
        'Arafah Moving In Diversion Hospital',
        'Arafah Moving In Deviation Hospital',
        'Arafah Moving In Departure Hospital',
        'Arafah Moving In Divergence Hospital',
        'Arafah Moving In Difference Hospital',
        'Arafah Moving In Variation Hospital',
        'Arafah Moving In Change Hospital',
        'Arafah Moving In Alteration Hospital',
        'Arafah Moving In Modification Hospital',
        'Arafah Moving In Adjustment Hospital',
        'Arafah Moving In Adaptation Hospital',
        'Arafah Moving In Accommodation Hospital',
        'Arafah Moving In Compromise Hospital',
        'Arafah Moving In Settlement Hospital',
        'Arafah Moving In Agreement Hospital',
        'Arafah Moving In Accord Hospital',
        'Arafah Moving In Harmony Hospital',
        'Arafah Moving In Concord Hospital',
        'Arafah Moving In Unity Hospital',
        'Arafah Moving In Unison Hospital',
        'Arafah Moving In Sync Hospital',
        'Arafah Moving In Tandem Hospital',
        'Arafah Moving In Parallel Hospital',
        'Arafah Moving In Sequence Hospital',
        'Arafah Moving In Order Hospital',
        'Arafah Moving In Line Hospital',
        'Arafah Moving In Formation Hospital',
        'Arafah Moving In Pattern Hospital',
        'Arafah Moving In Rhythm Hospital',
        'Arafah Moving In Beat Hospital',
        'Arafah Moving In Tempo Hospital',
        'Arafah Moving In Pace Hospital',
        'Arafah Moving In Speed Hospital',
        'Arafah Moving In Velocity Hospital',
        'Arafah Moving In Acceleration Hospital',
        'Arafah Moving In Momentum Hospital',
        'Arafah Moving In Force Hospital',
        'Arafah Moving In Power Hospital',
        'Arafah Moving In Energy Hospital',
        'Arafah Moving In Strength Hospital',
        'Arafah Moving In Vigor Hospital',
        'Arafah Moving In Vitality Hospital',
        'Arafah Moving In Life Hospital',
        'Arafah Moving In Spirit Hospital',
        'Arafah Moving In Soul Hospital',
        'Arafah Moving In Heart Hospital',
        'Arafah Moving In Mind Hospital',
        'Arafah Moving In Body Hospital',
        'Arafah Moving In Health Hospital',
        'Arafah Moving In Wellness Hospital',
        'Arafah Moving In Fitness Hospital',
        'Arafah Moving In Shape Hospital',
        'Arafah Moving In Form Hospital',
        'Arafah Moving In Condition Hospital',
        'Arafah Moving In State Hospital',
        'Arafah Moving In Status Hospital',
        'Arafah Moving In Position Hospital',
        'Arafah Moving In Place Hospital',
        'Arafah Moving In Location Hospital',
        'Arafah Moving In Site Hospital',
        'Arafah Moving In Spot Hospital',
        'Arafah Moving In Point Hospital',
        'Arafah Moving In Area Hospital',
        'Arafah Moving In Region Hospital',
        'Arafah Moving In Zone Hospital',
        'Arafah Moving In Sector Hospital',
        'Arafah Moving In Section Hospital',
        'Arafah Moving In Segment Hospital',
        'Arafah Moving In Part Hospital',
        'Arafah Moving In Piece Hospital',
        'Arafah Moving In Component Hospital',
        'Arafah Moving In Element Hospital',
        'Arafah Moving In Factor Hospital',
        'Arafah Moving In Aspect Hospital',
        'Arafah Moving In Feature Hospital',
        'Arafah Moving In Characteristic Hospital',
        'Arafah Moving In Trait Hospital',
        'Arafah Moving In Quality Hospital',
        'Arafah Moving In Property Hospital',
        'Arafah Moving In Attribute Hospital',
        'Arafah Moving In Nature Hospital',
        'Arafah Moving In Essence Hospital',
        'Arafah Moving In Substance Hospital',
        'Arafah Moving In Material Hospital',
        'Arafah Moving In Matter Hospital',
        'Arafah Moving In Stuff Hospital',
        'Arafah Moving In Thing Hospital',
        'Arafah Moving In Item Hospital',
        'Arafah Moving In Object Hospital',
        'Arafah Moving In Subject Hospital',
        'Arafah Moving In Topic Hospital',
        'Arafah Moving In Theme Hospital',
        'Arafah Moving In Issue Hospital',
        'Arafah Moving In Problem Hospital',
        'Arafah Moving In Challenge Hospital',
        'Arafah Moving In Difficulty Hospital',
        'Arafah Moving In Obstacle Hospital',
        'Arafah Moving In Barrier Hospital',
        'Arafah Moving In Hurdle Hospital',
        'Arafah Moving In Block Hospital',
        'Arafah Moving In Impediment Hospital',
        'Arafah Moving In Hindrance Hospital',
        'Arafah Moving In Interference Hospital',
        'Arafah Moving In Interruption Hospital',
        'Arafah Moving In Disruption Hospital',
        'Arafah Moving In Disturbance Hospital',
        'Arafah Moving In Distraction Hospital',
        'Arafah Moving In Diversion Hospital',
        'Arafah Moving In Deviation Hospital',
        'Arafah Moving In Departure Hospital',
        'Arafah Moving In Divergence Hospital',
        'Arafah Moving In Difference Hospital',
        'Arafah Moving In Variation Hospital',
        'Arafah Moving In Change Hospital',
        'Arafah Moving In Alteration Hospital',
        'Arafah Moving In Modification Hospital',
        'Arafah Moving In Adjustment Hospital',
        'Arafah Moving In Adaptation Hospital',
        'Arafah Moving In Accommodation Hospital',
        'Arafah Moving In Compromise Hospital',
        'Arafah Moving In Settlement Hospital',
        'Arafah Moving In Agreement Hospital',
        'Arafah Moving In Accord Hospital',
        'Arafah Moving In Harmony Hospital',
        'Arafah Moving In Concord Hospital',
        'Arafah Moving In Unity Hospital',
        // Additional Real Dhaka Private Hospitals
        'Bangladesh Eye Hospital, Dhaka',
        'Mirpur Adhunik Hospital, Mirpur',
        'Mirpur General Hospital, Mirpur',
        'Other',
        'Bangladesh Orthopedic Hospital, Dhaka',
        'Bangladesh Cancer Hospital, Dhaka',
        'Bangladesh Kidney Foundation Hospital, Dhaka',
        'Bangladesh Liver Foundation Hospital, Dhaka',
        'Bangladesh Cardiac Hospital, Dhaka',
        'Bangladesh Neuro Hospital, Dhaka',
        'Bangladesh Burn Institute, Dhaka',
        'Bangladesh Diabetic Hospital, Dhaka',
        'Bangladesh ENT Hospital, Dhaka',
        'Bangladesh Dental Hospital, Dhaka',
        'Bangladesh Maternity Hospital, Dhaka',
        'Bangladesh Pediatric Hospital, Dhaka',
        'Bangladesh Geriatric Hospital, Dhaka',
        'Bangladesh Rehabilitation Hospital, Dhaka',
        'Bangladesh Emergency Hospital, Dhaka',
        'Bangladesh Critical Care Hospital, Dhaka',
        'Bangladesh ICU Hospital, Dhaka',
        'Bangladesh Mental Health Hospital, Dhaka',
        'Bangladesh Psychiatry Hospital, Dhaka',
        'Bangladesh Home Care Services, Dhaka',
        'Bangladesh Ambulance Services, Dhaka',
        'Bangladesh Medical Services, Dhaka',
        'Bangladesh Health Services, Dhaka',
        'Bangladesh Care Services, Dhaka',
        // Chittagong
        'Chittagong Medical College Hospital, Chittagong',
        'Combined Military Hospital (CMH) Chittagong, Chittagong Cantonment',
        'Chattogram General Hospital, Chittagong',
        'Ibn Sina Hospital Chittagong, Chittagong',
        'Max Hospital Chittagong, Chittagong',
        'Parkview Hospital Chittagong, Chittagong',
        'Chattogram Maa-O-Shishu Hospital, Chittagong',
        'Chittagong Eye Infirmary and Training Complex, Chittagong',
        'Chittagong Diabetic General Hospital, Chittagong',
        'Chittagong Metropolitan Hospital, Chittagong',
        'Chittagong Medical College Hospital, Chittagong',
        'Cox\'s Bazar Medical College Hospital, Cox\'s Bazar',
        // Sylhet
        'Sylhet MAG Osmani Medical College Hospital, Sylhet',
        'Ibn Sina Hospital Sylhet, Sylhet',
        'North East Medical College Hospital, Sylhet',
        'Jalalabad Ragib-Rabeya Medical College Hospital, Sylhet',
        'Sylhet Women\'s Medical College Hospital, Sylhet',
        'Osmani Medical College Hospital, Sylhet',
        // Rajshahi
        'Rajshahi Medical College Hospital, Rajshahi',
        'Ibn Sina Hospital Rajshahi, Rajshahi',
        'Rajshahi Diabetic Association Medical College Hospital, Rajshahi',
        'Rajshahi Community Medical College Hospital, Rajshahi',
        'Northern Private Medical College Hospital, Rajshahi',
        // Khulna
        'Khulna Medical College Hospital, Khulna',
        'Gazi Medical College Hospital, Khulna',
        'Khulna City Medical College Hospital, Khulna',
        'Khulna Shishu Hospital, Khulna',
        'Khulna General Hospital, Khulna',
        // Barisal
        'Sher-e-Bangla Medical College Hospital, Barisal',
        'Barisal Medical College Hospital, Barisal',
        'Barisal General Hospital, Barisal',
        // Rangpur
        'Rangpur Medical College Hospital, Rangpur',
        'Prime Medical College Hospital Rangpur, Rangpur',
        'Rangpur Community Medical College Hospital, Rangpur',
        // Mymensingh
        'Mymensingh Medical College Hospital, Mymensingh',
        'Community Based Medical College Hospital Mymensingh, Mymensingh',
        // Comilla
        'Comilla Medical College Hospital, Comilla',
        'Comilla Diabetic Hospital, Comilla',
        'Comilla General Hospital, Comilla',
        // Jessore
        'Jessore Medical College Hospital, Jessore',
        'Jessore General Hospital, Jessore',
        // Bogra
        'Shaheed Ziaur Rahman Medical College Hospital, Bogra',
        'Bogra Medical College Hospital, Bogra',
        // Dinajpur
        'Dinajpur Medical College Hospital, Dinajpur',
        'Dinajpur General Hospital, Dinajpur',
        // Faridpur
        'Faridpur Medical College Hospital, Faridpur',
        'Faridpur General Hospital, Faridpur',
        // Pabna
        'Pabna Medical College Hospital, Pabna',
        'Pabna General Hospital, Pabna',
        // Noakhali
        'Noakhali Medical College Hospital, Noakhali',
        'Noakhali General Hospital, Noakhali',
        // Other Major Cities
        'Cox\'s Bazar District Hospital, Cox\'s Bazar',
        'Feni General Hospital, Feni',
        'Brahmanbaria General Hospital, Brahmanbaria',
        'Kushtia General Hospital, Kushtia',
        'Jhenaidah General Hospital, Jhenaidah',
        'Magura General Hospital, Magura',
        'Narayanganj General Hospital, Narayanganj',
        'Gazipur General Hospital, Gazipur',
        'Tangail General Hospital, Tangail',
        'Jamalpur General Hospital, Jamalpur',
        'Netrokona General Hospital, Netrokona',
        'Kishoreganj General Hospital, Kishoreganj',
        'Narsingdi General Hospital, Narsingdi',
        'Munshiganj General Hospital, Munshiganj',
        'Manikganj General Hospital, Manikganj',
        'Gopalganj General Hospital, Gopalganj',
        'Madaripur General Hospital, Madaripur',
        'Shariatpur General Hospital, Shariatpur',
        'Chandpur General Hospital, Chandpur',
        'Lakshmipur General Hospital, Lakshmipur',
        'Bhola General Hospital, Bhola',
        'Patuakhali General Hospital, Patuakhali',
        'Barguna General Hospital, Barguna',
        'Jhalokati General Hospital, Jhalokati',
        'Pirojpur General Hospital, Pirojpur',
        'Satkhira General Hospital, Satkhira',
        'Bagerhat General Hospital, Bagerhat',
        'Chuadanga General Hospital, Chuadanga',
        'Meherpur General Hospital, Meherpur',
        'Nawabganj General Hospital, Nawabganj',
        'Naogaon General Hospital, Naogaon',
        'Natore General Hospital, Natore',
        'Sirajganj General Hospital, Sirajganj',
        'Gaibandha General Hospital, Gaibandha',
        'Kurigram General Hospital, Kurigram',
        'Lalmonirhat General Hospital, Lalmonirhat',
        'Nilphamari General Hospital, Nilphamari',
        'Panchagarh General Hospital, Panchagarh',
        'Thakurgaon General Hospital, Thakurgaon',
        'Sunamganj General Hospital, Sunamganj',
        'Habiganj General Hospital, Habiganj',
        'Moulvibazar General Hospital, Moulvibazar',
        // All Districts - Comprehensive List
        // Dhaka Division Districts
        'Narayanganj 300 Bed General Hospital, Narayanganj',
        'Narayanganj Sadar Hospital, Narayanganj',
        'Gazipur District Hospital, Gazipur',
        'Gazipur Sadar Hospital, Gazipur',
        'Tangail District Hospital, Tangail',
        'Tangail Sadar Hospital, Tangail',
        'Kishoreganj District Hospital, Kishoreganj',
        'Kishoreganj Sadar Hospital, Kishoreganj',
        'Manikganj District Hospital, Manikganj',
        'Manikganj Sadar Hospital, Manikganj',
        'Munshiganj District Hospital, Munshiganj',
        'Munshiganj Sadar Hospital, Munshiganj',
        'Narsingdi District Hospital, Narsingdi',
        'Narsingdi Sadar Hospital, Narsingdi',
        'Faridpur District Hospital, Faridpur',
        'Faridpur Sadar Hospital, Faridpur',
        'Gopalganj District Hospital, Gopalganj',
        'Gopalganj Sadar Hospital, Gopalganj',
        'Madaripur District Hospital, Madaripur',
        'Madaripur Sadar Hospital, Madaripur',
        'Rajbari District Hospital, Rajbari',
        'Rajbari Sadar Hospital, Rajbari',
        'Shariatpur District Hospital, Shariatpur',
        'Shariatpur Sadar Hospital, Shariatpur',
        'Netrokona District Hospital, Netrokona',
        'Netrokona Sadar Hospital, Netrokona',
        'Jamalpur District Hospital, Jamalpur',
        'Jamalpur Sadar Hospital, Jamalpur',
        'Sherpur District Hospital, Sherpur',
        'Sherpur Sadar Hospital, Sherpur',
        // Chittagong Division Districts
        'Cox\'s Bazar District Hospital, Cox\'s Bazar',
        'Cox\'s Bazar Sadar Hospital, Cox\'s Bazar',
        'Feni District Hospital, Feni',
        'Feni Sadar Hospital, Feni',
        'Brahmanbaria District Hospital, Brahmanbaria',
        'Brahmanbaria Sadar Hospital, Brahmanbaria',
        'Chandpur District Hospital, Chandpur',
        'Chandpur Sadar Hospital, Chandpur',
        'Comilla District Hospital, Comilla',
        'Comilla Sadar Hospital, Comilla',
        'Lakshmipur District Hospital, Lakshmipur',
        'Lakshmipur Sadar Hospital, Lakshmipur',
        'Noakhali District Hospital, Noakhali',
        'Noakhali Sadar Hospital, Noakhali',
        'Rangamati District Hospital, Rangamati',
        'Rangamati Sadar Hospital, Rangamati',
        'Bandarban District Hospital, Bandarban',
        'Bandarban Sadar Hospital, Bandarban',
        'Khagrachhari District Hospital, Khagrachhari',
        'Khagrachhari Sadar Hospital, Khagrachhari',
        // Sylhet Division Districts
        'Sylhet District Hospital, Sylhet',
        'Sylhet Sadar Hospital, Sylhet',
        'Moulvibazar District Hospital, Moulvibazar',
        'Moulvibazar Sadar Hospital, Moulvibazar',
        'Sunamganj District Hospital, Sunamganj',
        'Sunamganj Sadar Hospital, Sunamganj',
        'Habiganj District Hospital, Habiganj',
        'Habiganj Sadar Hospital, Habiganj',
        // Rajshahi Division Districts
        'Rajshahi District Hospital, Rajshahi',
        'Rajshahi Sadar Hospital, Rajshahi',
        'Bogra District Hospital, Bogra',
        'Bogra Sadar Hospital, Bogra',
        'Joypurhat District Hospital, Joypurhat',
        'Joypurhat Sadar Hospital, Joypurhat',
        'Naogaon District Hospital, Naogaon',
        'Naogaon Sadar Hospital, Naogaon',
        'Natore District Hospital, Natore',
        'Natore Sadar Hospital, Natore',
        'Chapai Nawabganj District Hospital, Chapai Nawabganj',
        'Chapai Nawabganj Sadar Hospital, Chapai Nawabganj',
        'Pabna District Hospital, Pabna',
        'Pabna Sadar Hospital, Pabna',
        'Sirajganj District Hospital, Sirajganj',
        'Sirajganj Sadar Hospital, Sirajganj',
        // Khulna Division Districts
        'Khulna District Hospital, Khulna',
        'Khulna Sadar Hospital, Khulna',
        'Bagerhat District Hospital, Bagerhat',
        'Bagerhat Sadar Hospital, Bagerhat',
        'Chuadanga District Hospital, Chuadanga',
        'Chuadanga Sadar Hospital, Chuadanga',
        'Jashore District Hospital, Jashore',
        'Jashore Sadar Hospital, Jashore',
        'Jhenaidah District Hospital, Jhenaidah',
        'Jhenaidah Sadar Hospital, Jhenaidah',
        'Kushtia District Hospital, Kushtia',
        'Kushtia Sadar Hospital, Kushtia',
        'Magura District Hospital, Magura',
        'Magura Sadar Hospital, Magura',
        'Meherpur District Hospital, Meherpur',
        'Meherpur Sadar Hospital, Meherpur',
        'Narail District Hospital, Narail',
        'Narail Sadar Hospital, Narail',
        'Satkhira District Hospital, Satkhira',
        'Satkhira Sadar Hospital, Satkhira',
        // Barisal Division Districts
        'Barisal District Hospital, Barisal',
        'Barisal Sadar Hospital, Barisal',
        'Barguna District Hospital, Barguna',
        'Barguna Sadar Hospital, Barguna',
        'Bhola District Hospital, Bhola',
        'Bhola Sadar Hospital, Bhola',
        'Jhalokati District Hospital, Jhalokati',
        'Jhalokati Sadar Hospital, Jhalokati',
        'Patuakhali District Hospital, Patuakhali',
        'Patuakhali Sadar Hospital, Patuakhali',
        'Pirojpur District Hospital, Pirojpur',
        'Pirojpur Sadar Hospital, Pirojpur',
        // Rangpur Division Districts
        'Rangpur District Hospital, Rangpur',
        'Rangpur Sadar Hospital, Rangpur',
        'Dinajpur District Hospital, Dinajpur',
        'Dinajpur Sadar Hospital, Dinajpur',
        'Gaibandha District Hospital, Gaibandha',
        'Gaibandha Sadar Hospital, Gaibandha',
        'Kurigram District Hospital, Kurigram',
        'Kurigram Sadar Hospital, Kurigram',
        'Lalmonirhat District Hospital, Lalmonirhat',
        'Lalmonirhat Sadar Hospital, Lalmonirhat',
        'Nilphamari District Hospital, Nilphamari',
        'Nilphamari Sadar Hospital, Nilphamari',
        'Panchagarh District Hospital, Panchagarh',
        'Panchagarh Sadar Hospital, Panchagarh',
        'Thakurgaon District Hospital, Thakurgaon',
        'Thakurgaon Sadar Hospital, Thakurgaon',
        // Mymensingh Division Districts
        'Mymensingh District Hospital, Mymensingh',
        'Mymensingh Sadar Hospital, Mymensingh',
        'Jamalpur District Hospital, Jamalpur',
        'Jamalpur Sadar Hospital, Jamalpur',
        'Netrokona District Hospital, Netrokona',
        'Netrokona Sadar Hospital, Netrokona',
        'Sherpur District Hospital, Sherpur',
        'Sherpur Sadar Hospital, Sherpur',
        // Upazila Level Hospitals (Major Upazilas)
        'Savar Upazila Health Complex, Savar',
        'Dhamrai Upazila Health Complex, Dhamrai',
        'Keraniganj Upazila Health Complex, Keraniganj',
        'Dohar Upazila Health Complex, Dohar',
        'Nawabganj Upazila Health Complex, Nawabganj',
        'Manikganj Sadar Upazila Health Complex, Manikganj',
        'Shibchar Upazila Health Complex, Shibchar',
        'Madaripur Sadar Upazila Health Complex, Madaripur',
        'Rajoir Upazila Health Complex, Rajoir',
        'Shariatpur Sadar Upazila Health Complex, Shariatpur',
        'Naria Upazila Health Complex, Naria',
        'Bhedarganj Upazila Health Complex, Bhedarganj',
        'Hajiganj Upazila Health Complex, Hajiganj',
        'Kachua Upazila Health Complex, Kachua',
        'Matlab Upazila Health Complex, Matlab',
        'Shahrasti Upazila Health Complex, Shahrasti',
        'Chandpur Sadar Upazila Health Complex, Chandpur',
        'Faridganj Upazila Health Complex, Faridganj',
        'Lakshmipur Sadar Upazila Health Complex, Lakshmipur',
        'Raipur Upazila Health Complex, Raipur',
        'Ramganj Upazila Health Complex, Ramganj',
        'Ramgati Upazila Health Complex, Ramgati',
        'Begumganj Upazila Health Complex, Begumganj',
        'Chatkhil Upazila Health Complex, Chatkhil',
        'Companiganj Upazila Health Complex, Companiganj',
        'Hatiya Upazila Health Complex, Hatiya',
        'Kabirhat Upazila Health Complex, Kabirhat',
        'Noakhali Sadar Upazila Health Complex, Noakhali',
        'Senbagh Upazila Health Complex, Senbagh',
        'Sonaimuri Upazila Health Complex, Sonaimuri',
        'Subarnachar Upazila Health Complex, Subarnachar',
        'Feni Sadar Upazila Health Complex, Feni',
        'Chhagalnaiya Upazila Health Complex, Chhagalnaiya',
        'Daganbhuiyan Upazila Health Complex, Daganbhuiyan',
        'Parshuram Upazila Health Complex, Parshuram',
        'Sonagazi Upazila Health Complex, Sonagazi',
        'Brahmanbaria Sadar Upazila Health Complex, Brahmanbaria',
        'Ashuganj Upazila Health Complex, Ashuganj',
        'Bancharampur Upazila Health Complex, Bancharampur',
        'Kasba Upazila Health Complex, Kasba',
        'Nabinagar Upazila Health Complex, Nabinagar',
        'Nasirnagar Upazila Health Complex, Nasirnagar',
        'Sarail Upazila Health Complex, Sarail',
        'Akaura Upazila Health Complex, Akaura',
        'Barura Upazila Health Complex, Barura',
        'Brahmanpara Upazila Health Complex, Brahmanpara',
        'Burichong Upazila Health Complex, Burichong',
        'Chandina Upazila Health Complex, Chandina',
        'Chauddagram Upazila Health Complex, Chauddagram',
        'Comilla Sadar Upazila Health Complex, Comilla',
        'Daudkandi Upazila Health Complex, Daudkandi',
        'Debidwar Upazila Health Complex, Debidwar',
        'Homna Upazila Health Complex, Homna',
        'Laksam Upazila Health Complex, Laksam',
        'Monohargonj Upazila Health Complex, Monohargonj',
        'Meghna Upazila Health Complex, Meghna',
        'Muradnagar Upazila Health Complex, Muradnagar',
        'Nangalkot Upazila Health Complex, Nangalkot',
        'Titas Upazila Health Complex, Titas',
        'Chakaria Upazila Health Complex, Chakaria',
        'Cox\'s Bazar Sadar Upazila Health Complex, Cox\'s Bazar',
        'Kutubdia Upazila Health Complex, Kutubdia',
        'Maheshkhali Upazila Health Complex, Maheshkhali',
        'Pekua Upazila Health Complex, Pekua',
        'Ramu Upazila Health Complex, Ramu',
        'Teknaf Upazila Health Complex, Teknaf',
        'Ukhia Upazila Health Complex, Ukhia',
        'Bandarban Sadar Upazila Health Complex, Bandarban',
        'Alikadam Upazila Health Complex, Alikadam',
        'Lama Upazila Health Complex, Lama',
        'Naikhongchhari Upazila Health Complex, Naikhongchhari',
        'Rowangchhari Upazila Health Complex, Rowangchhari',
        'Ruma Upazila Health Complex, Ruma',
        'Thanchi Upazila Health Complex, Thanchi',
        'Rangamati Sadar Upazila Health Complex, Rangamati',
        'Bagaichhari Upazila Health Complex, Bagaichhari',
        'Barkal Upazila Health Complex, Barkal',
        'Juraichhari Upazila Health Complex, Juraichhari',
        'Kaptai Upazila Health Complex, Kaptai',
        'Kawkhali Upazila Health Complex, Kawkhali',
        'Langadu Upazila Health Complex, Langadu',
        'Naniarchar Upazila Health Complex, Naniarchar',
        'Rajasthali Upazila Health Complex, Rajasthali',
        'Dighinala Upazila Health Complex, Dighinala',
        'Khagrachhari Sadar Upazila Health Complex, Khagrachhari',
        'Lakshmichhari Upazila Health Complex, Lakshmichhari',
        'Mahalchhari Upazila Health Complex, Mahalchhari',
        'Manikchhari Upazila Health Complex, Manikchhari',
        'Matiranga Upazila Health Complex, Matiranga',
        'Panchhari Upazila Health Complex, Panchhari',
        'Ramgarh Upazila Health Complex, Ramgarh',
        'Balaganj Upazila Health Complex',
        'Beanibazar Upazila Health Complex',
        'Bishwanath Upazila Health Complex',
        'Balaganj Upazila Health Complex',
        'Fenchuganj Upazila Health Complex',
        'Golapganj Upazila Health Complex',
        'Gowainghat Upazila Health Complex',
        'Jaintiapur Upazila Health Complex',
        'Kanaighat Upazila Health Complex',
        'Osmani Nagar Upazila Health Complex',
        'Sylhet Sadar Upazila Health Complex',
        'Zakiganj Upazila Health Complex',
        'Barlekha Upazila Health Complex',
        'Juri Upazila Health Complex',
        'Kamalganj Upazila Health Complex',
        'Kulaura Upazila Health Complex',
        'Moulvibazar Sadar Upazila Health Complex',
        'Rajnagar Upazila Health Complex',
        'Sreemangal Upazila Health Complex',
        'Bishwamvarpur Upazila Health Complex',
        'Chhatak Upazila Health Complex',
        'Derai Upazila Health Complex',
        'Dharampasha Upazila Health Complex',
        'Dowarabazar Upazila Health Complex',
        'Jagannathpur Upazila Health Complex',
        'Jamalganj Upazila Health Complex',
        'Sulla Upazila Health Complex',
        'Sunamganj Sadar Upazila Health Complex',
        'Tahirpur Upazila Health Complex',
        'Ajmiriganj Upazila Health Complex',
        'Bahubal Upazila Health Complex',
        'Baniyachong Upazila Health Complex',
        'Chunarughat Upazila Health Complex',
        'Habiganj Sadar Upazila Health Complex',
        'Lakhai Upazila Health Complex',
        'Madhabpur Upazila Health Complex',
        'Nabiganj Upazila Health Complex',
        'Kalai Upazila Health Complex',
        'Khetlal Upazila Health Complex',
        'Panchbibi Upazila Health Complex',
        'Joypurhat Sadar Upazila Health Complex',
        'Akkelpur Upazila Health Complex',
        'Atrai Upazila Health Complex',
        'Badalgachhi Upazila Health Complex',
        'Dhamoirhat Upazila Health Complex',
        'Manda Upazila Health Complex',
        'Mahadebpur Upazila Health Complex',
        'Niamatpur Upazila Health Complex',
        'Patnitala Upazila Health Complex',
        'Porsha Upazila Health Complex',
        'Raninagar Upazila Health Complex',
        'Sapahar Upazila Health Complex',
        'Naogaon Sadar Upazila Health Complex',
        'Bagatipara Upazila Health Complex',
        'Baraigram Upazila Health Complex',
        'Gurudaspur Upazila Health Complex',
        'Lalpur Upazila Health Complex',
        'Natore Sadar Upazila Health Complex',
        'Singra Upazila Health Complex',
        'Belkuchi Upazila Health Complex',
        'Chauhali Upazila Health Complex',
        'Kamarkhand Upazila Health Complex',
        'Kazipur Upazila Health Complex',
        'Raiganj Upazila Health Complex',
        'Shahjadpur Upazila Health Complex',
        'Sirajganj Sadar Upazila Health Complex',
        'Tarash Upazila Health Complex',
        'Ullahpara Upazila Health Complex',
        'Atgharia Upazila Health Complex',
        'Bera Upazila Health Complex',
        'Bhangura Upazila Health Complex',
        'Chatmohar Upazila Health Complex',
        'Faridpur Upazila Health Complex',
        'Ishwardi Upazila Health Complex',
        'Pabna Sadar Upazila Health Complex',
        'Santhia Upazila Health Complex',
        'Sujanagar Upazila Health Complex',
        'Bagha Upazila Health Complex',
        'Bagmara Upazila Health Complex',
        'Charghat Upazila Health Complex',
        'Durgapur Upazila Health Complex',
        'Godagari Upazila Health Complex',
        'Mohanpur Upazila Health Complex',
        'Paba Upazila Health Complex',
        'Puthia Upazila Health Complex',
        'Rajshahi Sadar Upazila Health Complex',
        'Tanore Upazila Health Complex',
        'Bholahat Upazila Health Complex',
        'Gomastapur Upazila Health Complex',
        'Nachole Upazila Health Complex',
        'Chapai Nawabganj Sadar Upazila Health Complex',
        'Shibganj Upazila Health Complex',
        'Bogra Sadar Upazila Health Complex',
        'Dhunat Upazila Health Complex',
        'Dhupchanchia Upazila Health Complex',
        'Gabtali Upazila Health Complex',
        'Kahaloo Upazila Health Complex',
        'Nandigram Upazila Health Complex',
        'Sariakandi Upazila Health Complex',
        'Shajahanpur Upazila Health Complex',
        'Sherpur Upazila Health Complex',
        'Shibganj Upazila Health Complex',
        'Sonatala Upazila Health Complex',
        'Abhaynagar Upazila Health Complex',
        'Bagherpara Upazila Health Complex',
        'Chaugachha Upazila Health Complex',
        'Jhikargachha Upazila Health Complex',
        'Keshabpur Upazila Health Complex',
        'Jashore Sadar Upazila Health Complex',
        'Manirampur Upazila Health Complex',
        'Sharsha Upazila Health Complex',
        'Harinakunda Upazila Health Complex',
        'Jhenaidah Sadar Upazila Health Complex',
        'Kaliganj Upazila Health Complex',
        'Kotchandpur Upazila Health Complex',
        'Maheshpur Upazila Health Complex',
        'Shailkupa Upazila Health Complex',
        'Alamdanga Upazila Health Complex',
        'Chuadanga Sadar Upazila Health Complex',
        'Damurhuda Upazila Health Complex',
        'Jibannagar Upazila Health Complex',
        'Bheramara Upazila Health Complex',
        'Daulatpur Upazila Health Complex',
        'Khoksa Upazila Health Complex',
        'Kumarkhali Upazila Health Complex',
        'Kushtia Sadar Upazila Health Complex',
        'Mirpur Upazila Health Complex',
        'Magura Sadar Upazila Health Complex',
        'Mohammadpur Upazila Health Complex',
        'Shalikha Upazila Health Complex',
        'Sreepur Upazila Health Complex',
        'Gangni Upazila Health Complex',
        'Mujibnagar Upazila Health Complex',
        'Meherpur Sadar Upazila Health Complex',
        'Kalia Upazila Health Complex',
        'Lohagara Upazila Health Complex',
        'Narail Sadar Upazila Health Complex',
        'Assasuni Upazila Health Complex',
        'Debhata Upazila Health Complex',
        'Kalaroa Upazila Health Complex',
        'Kaliganj Upazila Health Complex',
        'Satkhira Sadar Upazila Health Complex',
        'Shyamnagar Upazila Health Complex',
        'Tala Upazila Health Complex',
        'Chitalmari Upazila Health Complex',
        'Fakirhat Upazila Health Complex',
        'Kachua Upazila Health Complex, Kachua',
        'Mollahat Upazila Health Complex',
        'Mongla Upazila Health Complex',
        'Morrelganj Upazila Health Complex',
        'Rampal Upazila Health Complex',
        'Sarankhola Upazila Health Complex',
        'Bagerhat Sadar Upazila Health Complex',
        'Amtali Upazila Health Complex',
        'Bamna Upazila Health Complex',
        'Barguna Sadar Upazila Health Complex',
        'Betagi Upazila Health Complex',
        'Patharghata Upazila Health Complex',
        'Taltali Upazila Health Complex',
        'Agailjhara Upazila Health Complex',
        'Babuganj Upazila Health Complex',
        'Bakerganj Upazila Health Complex',
        'Banaripara Upazila Health Complex',
        'Gaurnadi Upazila Health Complex',
        'Hizla Upazila Health Complex',
        'Mehendiganj Upazila Health Complex',
        'Muladi Upazila Health Complex',
        'Wazirpur Upazila Health Complex',
        'Barisal Sadar Upazila Health Complex',
        'Bhola Sadar Upazila Health Complex',
        'Burhanuddin Upazila Health Complex',
        'Char Fasson Upazila Health Complex',
        'Daulatkhan Upazila Health Complex',
        'Lalmohan Upazila Health Complex',
        'Manpura Upazila Health Complex',
        'Tazumuddin Upazila Health Complex',
        'Jhalokati Sadar Upazila Health Complex',
        'Kathalia Upazila Health Complex',
        'Nalchity Upazila Health Complex',
        'Rajapur Upazila Health Complex',
        'Bauphal Upazila Health Complex',
        'Dashmina Upazila Health Complex',
        'Dumki Upazila Health Complex',
        'Galachipa Upazila Health Complex',
        'Kalapara Upazila Health Complex',
        'Mirzaganj Upazila Health Complex',
        'Patuakhali Sadar Upazila Health Complex',
        'Rangabali Upazila Health Complex',
        'Bhandaria Upazila Health Complex',
        'Kawkhali Upazila Health Complex, Kawkhali',
        'Mathbaria Upazila Health Complex',
        'Nazirpur Upazila Health Complex',
        'Pirojpur Sadar Upazila Health Complex',
        'Nesarabad Upazila Health Complex',
        'Zianagar Upazila Health Complex',
        'Badarganj Upazila Health Complex',
        'Gangachara Upazila Health Complex',
        'Kaunia Upazila Health Complex',
        'Mithapukur Upazila Health Complex',
        'Pirgacha Upazila Health Complex',
        'Pirgacha Upazila Health Complex',
        'Rangpur Sadar Upazila Health Complex',
        'Taraganj Upazila Health Complex',
        'Birampur Upazila Health Complex',
        'Birganj Upazila Health Complex',
        'Biral Upazila Health Complex',
        'Bochaganj Upazila Health Complex',
        'Chirirbandar Upazila Health Complex',
        'Fulbari Upazila Health Complex',
        'Ghoraghat Upazila Health Complex',
        'Hakimpur Upazila Health Complex',
        'Kaharole Upazila Health Complex',
        'Khansama Upazila Health Complex',
        'Nawabganj Upazila Health Complex, Nawabganj',
        'Parbatipur Upazila Health Complex',
        'Dinajpur Sadar Upazila Health Complex',
        'Fulchhari Upazila Health Complex',
        'Gaibandha Sadar Upazila Health Complex',
        'Gobindaganj Upazila Health Complex',
        'Palashbari Upazila Health Complex',
        'Sadullapur Upazila Health Complex',
        'Saghata Upazila Health Complex',
        'Sundarganj Upazila Health Complex',
        'Bhurungamari Upazila Health Complex',
        'Char Rajibpur Upazila Health Complex',
        'Chilmari Upazila Health Complex',
        'Kurigram Sadar Upazila Health Complex',
        'Nageshwari Upazila Health Complex',
        'Phulbari Upazila Health Complex',
        'Rajarhat Upazila Health Complex',
        'Raomari Upazila Health Complex',
        'Ulipur Upazila Health Complex',
        'Aditmari Upazila Health Complex',
        'Hatibandha Upazila Health Complex',
        'Kaliganj Upazila Health Complex',
        'Lalmonirhat Sadar Upazila Health Complex',
        'Patgram Upazila Health Complex',
        'Dimla Upazila Health Complex',
        'Domar Upazila Health Complex',
        'Jaldhaka Upazila Health Complex',
        'Kishoreganj Upazila Health Complex',
        'Nilphamari Sadar Upazila Health Complex',
        'Saidpur Upazila Health Complex',
        'Atwari Upazila Health Complex',
        'Boda Upazila Health Complex',
        'Debiganj Upazila Health Complex',
        'Panchagarh Sadar Upazila Health Complex',
        'Tetulia Upazila Health Complex',
        'Baliadangi Upazila Health Complex',
        'Haripur Upazila Health Complex',
        'Pirganj Upazila Health Complex',
        'Ranisankail Upazila Health Complex',
        'Thakurgaon Sadar Upazila Health Complex',
        'Dewanganj Upazila Health Complex',
        'Islampur Upazila Health Complex',
        'Jamalpur Sadar Upazila Health Complex',
        'Madarganj Upazila Health Complex',
        'Melandaha Upazila Health Complex',
        'Sarishabari Upazila Health Complex',
        'Bhaluka Upazila Health Complex',
        'Dhobaura Upazila Health Complex',
        'Fulbaria Upazila Health Complex',
        'Gaffargaon Upazila Health Complex',
        'Gauripur Upazila Health Complex',
        'Haluaghat Upazila Health Complex',
        'Ishwarganj Upazila Health Complex',
        'Muktagachha Upazila Health Complex',
        'Mymensingh Sadar Upazila Health Complex',
        'Nandail Upazila Health Complex',
        'Phulpur Upazila Health Complex',
        'Tarakanda Upazila Health Complex',
        'Atpara Upazila Health Complex',
        'Barhatta Upazila Health Complex',
        'Durgapur Upazila Health Complex',
        'Kalmakanda Upazila Health Complex',
        'Kendua Upazila Health Complex',
        'Khaliajuri Upazila Health Complex',
        'Madan Upazila Health Complex',
        'Mohanganj Upazila Health Complex',
        'Netrokona Sadar Upazila Health Complex',
        'Purbadhala Upazila Health Complex',
        'Jhenaigati Upazila Health Complex',
        'Nakla Upazila Health Complex',
        'Nalitabari Upazila Health Complex',
        'Sherpur Sadar Upazila Health Complex',
        'Sreebardi Upazila Health Complex',
        'Other',
    ];

    const filteredHospitals = hospitals.filter(hospital =>
        hospital.toLowerCase().includes(hospitalSearch.toLowerCase())
    );

    const { data, setData, post, processing, errors, reset } = useForm({
        blood_group: '',
        units_needed: '',
        urgency: 'normal',
        patient_name: '',
        hospital_name: '',
        hospital_address: '',
        city: '',
        state: '',
        contact_phone: '',
        contact_email: '',
        needed_by_date: '',
        needed_by_time: '',
        additional_info: '',
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Use the search value if hospital_name is not set (user typed custom hospital)
        if (!data.hospital_name && hospitalSearch.trim()) {
            setData('hospital_name', hospitalSearch.trim());
        }
        
        // Validate hospital name
        if (!data.hospital_name || data.hospital_name.trim() === '') {
            alert('Please enter a hospital name');
            return;
        }
        
        try {
            // Include coordinates if available
            const requestData = {
                ...data,
                latitude: mapCoordinates?.lat || null,
                longitude: mapCoordinates?.lng || null,
            };
            
            const response = await axios.post('/api/blood-donors/request', requestData);
            if (response.data.success) {
                setSubmitted(true);
                reset();
                setHospitalSearch('');
                setAddressSuggestions([]);
                setShowAddressSuggestions(false);
                setCitySuggestions([]);
                setShowCitySuggestions(false);
                setStateSuggestions([]);
                setShowStateSuggestions(false);
                setMapCoordinates(null);
                setTimeout(() => {
                    setShowForm(false);
                    setSubmitted(false);
                }, 3000);
            }
        } catch (error) {
            console.error('Error submitting blood request:', error);
            console.error('Error response:', error.response?.data);
            
            // Handle CSRF token mismatch - should be auto-retried by interceptor
            if (error.response?.status === 419) {
                // If retry failed, show user-friendly message
                alert('Session expired. Please refresh the page and try again.');
                return;
            }
            
            if (error.response?.data?.errors) {
                const errors = error.response.data.errors;
                const errorMessage = Object.values(errors).flat().join(', ');
                alert(`Failed to submit: ${errorMessage}`);
            } else if (error.response?.data?.message) {
                alert(`Failed to submit: ${error.response.data.message}`);
            } else if (error.response?.data?.error) {
                alert(`Failed to submit: ${error.response.data.error}`);
            } else {
                alert('Failed to submit blood request. Please try again.');
            }
        }
    };

    const handleHospitalSelect = async (hospital) => {
        setData('hospital_name', hospital);
        setHospitalSearch(hospital);
        setShowHospitalSuggestions(false);
        
        // Extract area from hospital name (e.g., "Square Hospital, Panthapath" -> "Panthapath")
        const areaMatch = hospital.match(/,\s*(.+)$/);
        const area = areaMatch ? areaMatch[1] : '';
        
        const googleApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
        
        // Try Google Maps Geocoding API first (more accurate) - Get multiple suggestions
        if (googleApiKey) {
            try {
                const query = encodeURIComponent(hospital + ', Bangladesh');
                // Get up to 5 results for suggestions
                const googleResponse = await fetch(
                    `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${googleApiKey}&region=bd`
                );
                
                if (googleResponse.ok) {
                    const googleData = await googleResponse.json();
                    if (googleData.status === 'OK' && googleData.results && googleData.results.length > 0) {
                        // Store all results as suggestions
                        const suggestions = googleData.results.map(result => {
                            let address = '';
                            let city = '';
                            let state = '';
                            
                            // Extract address components
                            if (result.address_components) {
                                const streetParts = [];
                                result.address_components.forEach(component => {
                                    const types = component.types;
                                    
                                    if (types.includes('street_number') || types.includes('route')) {
                                        streetParts.push(component.long_name);
                                    }
                                    if (types.includes('sublocality') || types.includes('sublocality_level_1')) {
                                        streetParts.push(component.long_name);
                                    }
                                    
                                    if (types.includes('locality')) {
                                        city = component.long_name;
                                    } else if (types.includes('administrative_area_level_2')) {
                                        if (!city) city = component.long_name;
                                    }
                                    
                                    if (types.includes('administrative_area_level_1')) {
                                        state = component.long_name;
                                    }
                                });
                                address = streetParts.join(', ');
                            }
                            
                            // Use formatted address if no street address found
                            if (!address) {
                                address = result.formatted_address || '';
                                // Remove hospital name and country
                                const hospitalName = hospital.split(',')[0].trim();
                                address = address.replace(new RegExp(hospitalName, 'gi'), '').trim();
                                address = address.replace(/,\s*Bangladesh/gi, '').trim();
                                address = address.replace(/^,\s*/, '').replace(/,\s*$/, '').trim();
                            }
                            
                            return {
                                address: address || result.formatted_address,
                                city,
                                state,
                                coordinates: result.geometry?.location ? {
                                    lat: result.geometry.location.lat,
                                    lng: result.geometry.location.lng
                                } : null,
                                fullAddress: result.formatted_address
                            };
                        });
                        
                        // Set suggestions
                        setHospitalAddressSuggestions(suggestions);
                        setShowHospitalAddressSuggestions(true);
                        
                        // Auto-select the first (most relevant) result
                        const result = googleData.results[0];
                        
                        // Get formatted address from Google (exact address)
                        const formattedAddress = result.formatted_address || '';
                        
                        // Extract address components
                        let streetAddress = '';
                        let city = '';
                        let state = '';
                        let postalCode = '';
                        
                        if (result.address_components) {
                            result.address_components.forEach(component => {
                                const types = component.types;
                                
                                // Street address
                                if (types.includes('street_number')) {
                                    streetAddress = component.long_name + ' ' + streetAddress;
                                }
                                if (types.includes('route')) {
                                    streetAddress = streetAddress + component.long_name;
                                }
                                if (types.includes('sublocality') || types.includes('sublocality_level_1')) {
                                    if (!streetAddress) {
                                        streetAddress = component.long_name;
                                    } else {
                                        streetAddress = streetAddress + ', ' + component.long_name;
                                    }
                                }
                                
                                // City
                                if (types.includes('locality')) {
                                    city = component.long_name;
                                } else if (types.includes('administrative_area_level_2')) {
                                    if (!city) city = component.long_name;
                                }
                                
                                // State
                                if (types.includes('administrative_area_level_1')) {
                                    state = component.long_name;
                                }
                                
                                // Postal code
                                if (types.includes('postal_code')) {
                                    postalCode = component.long_name;
                                }
                            });
                        }
                        
                        // Use street address if available, otherwise use formatted address
                        let address = streetAddress.trim() || formattedAddress;
                        
                        // Remove hospital name and country from address if present
                        const hospitalName = hospital.split(',')[0].trim();
                        address = address.replace(new RegExp(hospitalName, 'gi'), '').trim();
                        address = address.replace(/,\s*Bangladesh/gi, '').trim();
                        address = address.replace(/^,\s*/, '').replace(/,\s*$/, '').trim();
                        
                        // Set the form fields
                        if (address) {
                            setData('hospital_address', address);
                        }
                        
                        if (city) {
                            setData('city', city);
                        }
                        
                        if (state) {
                            setData('state', state);
                        } else if (suggestions.length > 0 && suggestions[0].state) {
                            // Fallback: Use state from first suggestion if not found in first result
                            setData('state', suggestions[0].state);
                        } else if (city) {
                            // Fallback: Infer state from city name
                            const cityLower = city.toLowerCase();
                            if (cityLower.includes('dhaka')) {
                                setData('state', 'Dhaka Division');
                            } else if (cityLower.includes('chittagong') || cityLower.includes('chattogram')) {
                                setData('state', 'Chittagong Division');
                            } else if (cityLower.includes('sylhet')) {
                                setData('state', 'Sylhet Division');
                            } else if (cityLower.includes('rajshahi')) {
                                setData('state', 'Rajshahi Division');
                            } else if (cityLower.includes('khulna')) {
                                setData('state', 'Khulna Division');
                            } else if (cityLower.includes('barisal')) {
                                setData('state', 'Barisal Division');
                            } else if (cityLower.includes('rangpur')) {
                                setData('state', 'Rangpur Division');
                            } else if (cityLower.includes('mymensingh')) {
                                setData('state', 'Mymensingh Division');
                            }
                        }
                        
                        // Store coordinates for map from first result
                        if (result.geometry && result.geometry.location) {
                            setMapCoordinates({
                                lat: result.geometry.location.lat,
                                lng: result.geometry.location.lng
                            });
                        }
                        
                        return; // Success, exit early
                    }
                }
            } catch (error) {
                console.log('Google Maps API error, trying fallback:', error);
                // Continue to OpenStreetMap fallback
            }
        }
        
        // Also try Google Places Autocomplete for more suggestions if API key is available
        if (googleApiKey) {
            try {
                const query = encodeURIComponent(hospital + ', Bangladesh');
                // Use Places Autocomplete API for better suggestions
                const placesResponse = await fetch(
                    `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${query}&key=${googleApiKey}&components=country:bd`
                );
                
                if (placesResponse.ok) {
                    const placesData = await placesResponse.json();
                    if (placesData.status === 'OK' && placesData.predictions && placesData.predictions.length > 0) {
                        // Get details for each prediction
                        const suggestionPromises = placesData.predictions.slice(0, 5).map(async (prediction) => {
                            try {
                                const detailResponse = await fetch(
                                    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&key=${googleApiKey}&fields=formatted_address,address_components,geometry`
                                );
                                if (detailResponse.ok) {
                                    const detailData = await detailResponse.json();
                                    if (detailData.status === 'OK' && detailData.result) {
                                        const result = detailData.result;
                                        let address = '';
                                        let city = '';
                                        let state = '';
                                        
                                        if (result.address_components) {
                                            const streetParts = [];
                                            result.address_components.forEach(component => {
                                                const types = component.types;
                                                if (types.includes('street_number') || types.includes('route') || 
                                                    types.includes('sublocality') || types.includes('sublocality_level_1')) {
                                                    streetParts.push(component.long_name);
                                                }
                                                if (types.includes('locality') || types.includes('administrative_area_level_2')) {
                                                    if (!city) city = component.long_name;
                                                }
                                                if (types.includes('administrative_area_level_1')) {
                                                    state = component.long_name;
                                                }
                                            });
                                            address = streetParts.join(', ');
                                        }
                                        
                                        return {
                                            address: address || result.formatted_address,
                                            city,
                                            state,
                                            coordinates: result.geometry?.location ? {
                                                lat: result.geometry.location.lat,
                                                lng: result.geometry.location.lng
                                            } : null,
                                            fullAddress: result.formatted_address,
                                            description: prediction.description
                                        };
                                    }
                                }
                            } catch (e) {
                                return null;
                            }
                            return null;
                        });
                        
                        const placeSuggestions = (await Promise.all(suggestionPromises)).filter(s => s !== null);
                        if (placeSuggestions.length > 0) {
                            setHospitalAddressSuggestions(placeSuggestions);
                            setShowHospitalAddressSuggestions(true);
                            return; // Success
                        }
                    }
                }
            } catch (error) {
                console.log('Google Places API error, using geocoding results');
            }
        }
        
        // Fallback to OpenStreetMap Nominatim API if Google Maps fails or no API key
        try {
            const query = encodeURIComponent(hospital + ', Bangladesh');
            const nominatimResponse = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&countrycodes=bd&addressdetails=1`,
                {
                    headers: {
                        'User-Agent': 'BloodDonationApp/1.0'
                    }
                }
            );
            
            if (nominatimResponse.ok) {
                const responseData = await nominatimResponse.json();
                if (responseData && responseData.length > 0) {
                    const result = responseData[0];
                    let address = '';
                    let city = '';
                    let state = '';
                    
                    if (result.address) {
                        const addr = result.address;
                        const parts = [];
                        if (addr.road) parts.push(addr.road);
                        if (addr.house_number) parts.push(addr.house_number);
                        if (addr.suburb) parts.push(addr.suburb);
                        if (addr.neighbourhood) parts.push(addr.neighbourhood);
                        if (addr.village) parts.push(addr.village);
                        if (addr.quarter) parts.push(addr.quarter);
                        if (addr.residential) parts.push(addr.residential);
                        
                        address = parts.join(', ');
                        
                        if (addr.city) {
                            city = addr.city;
                        } else if (addr.town) {
                            city = addr.town;
                        } else if (addr.municipality) {
                            city = addr.municipality;
                        } else if (addr.county) {
                            city = addr.county;
                        }
                        
                        if (addr.state) {
                            state = addr.state;
                        } else if (addr.region) {
                            state = addr.region;
                        }
                    }
                    
                    if (!address && result.display_name) {
                        const displayName = result.display_name || '';
                        const displayParts = displayName.split(',').map(p => p.trim()).filter(p => p);
                        const hospitalNameParts = hospital.split(',').map(p => p.trim());
                        const filteredParts = displayParts.filter(part => {
                            const lowerPart = part.toLowerCase();
                            return !hospitalNameParts.some(hp => lowerPart.includes(hp.toLowerCase())) &&
                                   !lowerPart.includes('bangladesh') &&
                                   part.length > 2;
                        });
                        address = filteredParts.slice(0, 3).join(', ');
                        
                        // Try to extract state from display name if not found in address components
                        if (!state && displayParts.length >= 3) {
                            // State is usually in the last 2-3 parts
                            for (let i = displayParts.length - 2; i < displayParts.length; i++) {
                                const part = displayParts[i];
                                if (part && 
                                    !part.toLowerCase().includes('bangladesh') &&
                                    part.length > 2 &&
                                    !part.match(/^\d+$/)) {
                                    // Check if it looks like a division/state name
                                    const lowerPart = part.toLowerCase();
                                    if (lowerPart.includes('division') || 
                                        lowerPart.includes('dhaka') || 
                                        lowerPart.includes('chittagong') ||
                                        lowerPart.includes('sylhet') ||
                                        lowerPart.includes('rajshahi') ||
                                        lowerPart.includes('khulna') ||
                                        lowerPart.includes('barisal') ||
                                        lowerPart.includes('rangpur') ||
                                        lowerPart.includes('mymensingh')) {
                                        state = part;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    
                    if (!address && area) {
                        address = area;
                    }
                    if (!city && area) {
                        city = area;
                    }
                    
                    if (address) setData('hospital_address', address);
                    if (city) {
                        setData('city', city);
                        // Auto-fill state based on city if state is not found
                        if (!state) {
                            const cityLower = city.toLowerCase();
                            if (cityLower.includes('dhaka')) {
                                state = 'Dhaka Division';
                            } else if (cityLower.includes('chittagong') || cityLower.includes('chattogram')) {
                                state = 'Chittagong Division';
                            } else if (cityLower.includes('sylhet')) {
                                state = 'Sylhet Division';
                            } else if (cityLower.includes('rajshahi')) {
                                state = 'Rajshahi Division';
                            } else if (cityLower.includes('khulna')) {
                                state = 'Khulna Division';
                            } else if (cityLower.includes('barisal')) {
                                state = 'Barisal Division';
                            } else if (cityLower.includes('rangpur')) {
                                state = 'Rangpur Division';
                            } else if (cityLower.includes('mymensingh')) {
                                state = 'Mymensingh Division';
                            }
                        }
                    }
                    if (state) {
                        setData('state', state);
                    } else if (area) {
                        // Last fallback: if we have area like "Dhaka", try to infer state
                        const areaLower = area.toLowerCase();
                        if (areaLower.includes('dhaka')) {
                            setData('state', 'Dhaka Division');
                        } else if (areaLower.includes('chittagong') || areaLower.includes('chattogram')) {
                            setData('state', 'Chittagong Division');
                        } else if (areaLower.includes('sylhet')) {
                            setData('state', 'Sylhet Division');
                        } else if (areaLower.includes('rajshahi')) {
                            setData('state', 'Rajshahi Division');
                        } else if (areaLower.includes('khulna')) {
                            setData('state', 'Khulna Division');
                        } else if (areaLower.includes('barisal')) {
                            setData('state', 'Barisal Division');
                        } else if (areaLower.includes('rangpur')) {
                            setData('state', 'Rangpur Division');
                        } else if (areaLower.includes('mymensingh')) {
                            setData('state', 'Mymensingh Division');
                        }
                    }
                    
                    if (result.lat && result.lon) {
                        setMapCoordinates({
                            lat: parseFloat(result.lat),
                            lng: parseFloat(result.lon)
                        });
                    }
                } else {
                    if (area) {
                        setData('hospital_address', area);
                        setData('city', area);
                    }
                }
            } else {
                if (area) {
                    setData('hospital_address', area);
                    setData('city', area);
                }
            }
        } catch (error) {
            console.log('Could not fetch address automatically:', error);
            if (area) {
                setData('hospital_address', area);
                setData('city', area);
            }
        }
    };

    const handleHospitalInputChange = (value) => {
        setHospitalSearch(value);
        setShowHospitalSuggestions(true);
        
        // If the typed value exactly matches a hospital, auto-select it
        const exactMatch = hospitals.find(h => h.toLowerCase() === value.toLowerCase());
        if (exactMatch) {
            setData('hospital_name', exactMatch);
        } else {
            // Allow free text - set hospital_name to the typed value
            setData('hospital_name', value.trim() || '');
        }
    };

    // Handle address input with autocomplete suggestions
    const handleAddressInputChange = async (value) => {
        setData('hospital_address', value);
        
        if (value.length > 3) {
            try {
                // Use OpenStreetMap Nominatim API (completely free, no API key needed)
                const query = encodeURIComponent(value + ', Bangladesh');
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=5&countrycodes=bd&addressdetails=1`,
                    {
                        headers: {
                            'User-Agent': 'BloodDonationApp/1.0'
                        }
                    }
                );
                
                if (response.ok) {
                    const addressData = await response.json();
                    // Extract address without hospital/place names - use road, suburb, area
                    const addresses = addressData.map(item => {
                        if (item.address) {
                            const addr = item.address;
                            const parts = [];
                            if (addr.road) parts.push(addr.road);
                            if (addr.house_number) parts.push(addr.house_number);
                            if (addr.suburb) parts.push(addr.suburb);
                            if (addr.neighbourhood) parts.push(addr.neighbourhood);
                            if (addr.village) parts.push(addr.village);
                            if (addr.town) parts.push(addr.town);
                            if (addr.city) parts.push(addr.city);
                            return parts.join(', ') || item.display_name;
                        }
                        return item.display_name;
                    });
                    setAddressSuggestions(addresses);
                    setShowAddressSuggestions(true);
                }
            } catch (error) {
                console.log('Error fetching address suggestions:', error);
            }
        } else {
            setAddressSuggestions([]);
            setShowAddressSuggestions(false);
        }
    };

    const handleHospitalAddressSelect = (suggestion) => {
        if (suggestion.address) {
            setData('hospital_address', suggestion.address);
        }
        if (suggestion.city) {
            setData('city', suggestion.city);
        }
        if (suggestion.state) {
            setData('state', suggestion.state);
        } else {
            // Try to extract state from full address if not provided
            let stateFound = false;
            if (suggestion.fullAddress) {
                const addressParts = suggestion.fullAddress.split(',').map(p => p.trim());
                // State is usually in the last 2-3 parts before Bangladesh
                for (let i = addressParts.length - 2; i >= 0; i--) {
                    const part = addressParts[i];
                    if (part && 
                        !part.toLowerCase().includes('bangladesh') &&
                        part.length > 2 &&
                        (part.toLowerCase().includes('division') ||
                         part.toLowerCase().includes('dhaka') ||
                         part.toLowerCase().includes('chittagong') ||
                         part.toLowerCase().includes('chattogram') ||
                         part.toLowerCase().includes('sylhet') ||
                         part.toLowerCase().includes('rajshahi') ||
                         part.toLowerCase().includes('khulna') ||
                         part.toLowerCase().includes('barisal') ||
                         part.toLowerCase().includes('rangpur') ||
                         part.toLowerCase().includes('mymensingh'))) {
                        setData('state', part);
                        stateFound = true;
                        break;
                    }
                }
            }
            // Fallback: Infer state from city if still not found
            if (!stateFound && suggestion.city) {
                const cityLower = suggestion.city.toLowerCase();
                if (cityLower.includes('dhaka')) {
                    setData('state', 'Dhaka Division');
                } else if (cityLower.includes('chittagong') || cityLower.includes('chattogram')) {
                    setData('state', 'Chittagong Division');
                } else if (cityLower.includes('sylhet')) {
                    setData('state', 'Sylhet Division');
                } else if (cityLower.includes('rajshahi')) {
                    setData('state', 'Rajshahi Division');
                } else if (cityLower.includes('khulna')) {
                    setData('state', 'Khulna Division');
                } else if (cityLower.includes('barisal')) {
                    setData('state', 'Barisal Division');
                } else if (cityLower.includes('rangpur')) {
                    setData('state', 'Rangpur Division');
                } else if (cityLower.includes('mymensingh')) {
                    setData('state', 'Mymensingh Division');
                }
            }
        }
        if (suggestion.coordinates) {
            setMapCoordinates(suggestion.coordinates);
        }
        setShowHospitalAddressSuggestions(false);
    };

    const handleAddressSelect = async (address) => {
        setData('hospital_address', address);
        setShowAddressSuggestions(false);
        
        // Try to extract city and state from the selected address and get coordinates
        try {
            const query = encodeURIComponent(address + ', Bangladesh');
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&countrycodes=bd&addressdetails=1`,
                {
                    headers: {
                        'User-Agent': 'BloodDonationApp/1.0'
                    }
                }
            );
            
            if (response.ok) {
                const responseData = await response.json();
                if (responseData && responseData.length > 0) {
                    const result = responseData[0];
                    
                    // Extract city and state
                    let city = '';
                    let state = '';
                    if (result.address) {
                        const addr = result.address;
                        if (addr.city && !data.city) {
                            city = addr.city;
                            setData('city', city);
                        } else if (addr.town && !data.city) {
                            city = addr.town;
                            setData('city', city);
                        } else if (addr.municipality && !data.city) {
                            city = addr.municipality;
                            setData('city', city);
                        }
                        
                        if (addr.state && !data.state) {
                            state = addr.state;
                            setData('state', state);
                        } else if (addr.region && !data.state) {
                            state = addr.region;
                            setData('state', state);
                        }
                    }
                    
                    // Auto-fill state based on city if state is not found
                    if (!state && city) {
                        const cityLower = city.toLowerCase();
                        if (cityLower.includes('dhaka')) {
                            setData('state', 'Dhaka Division');
                        } else if (cityLower.includes('chittagong') || cityLower.includes('chattogram')) {
                            setData('state', 'Chittagong Division');
                        } else if (cityLower.includes('sylhet')) {
                            setData('state', 'Sylhet Division');
                        } else if (cityLower.includes('rajshahi')) {
                            setData('state', 'Rajshahi Division');
                        } else if (cityLower.includes('khulna')) {
                            setData('state', 'Khulna Division');
                        } else if (cityLower.includes('barisal')) {
                            setData('state', 'Barisal Division');
                        } else if (cityLower.includes('rangpur')) {
                            setData('state', 'Rangpur Division');
                        } else if (cityLower.includes('mymensingh')) {
                            setData('state', 'Mymensingh Division');
                        }
                    }
                    
                    // Store coordinates for map
                    if (result.lat && result.lon) {
                        setMapCoordinates({
                            lat: parseFloat(result.lat),
                            lng: parseFloat(result.lon)
                        });
                    }
                }
            }
        } catch (error) {
            console.log('Could not extract city/state from address:', error);
        }
    };

    // Handle city input with autocomplete
    const handleCityInputChange = async (value) => {
        setData('city', value);
        
        if (value.length > 2) {
            try {
                const query = encodeURIComponent(value + ', Bangladesh');
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=5&countrycodes=bd&addressdetails=1&featuretype=city`,
                    {
                        headers: {
                            'User-Agent': 'BloodDonationApp/1.0'
                        }
                    }
                );
                
                if (response.ok) {
                    const cityStateData = await response.json();
                    const cities = cityStateData
                        .map(item => {
                            if (item.address) {
                                return item.address.city || item.address.town || item.address.municipality || item.display_name.split(',')[0];
                            }
                            return item.display_name.split(',')[0];
                        })
                        .filter((city, index, self) => city && self.indexOf(city) === index)
                        .slice(0, 5);
                    setCitySuggestions(cities);
                    setShowCitySuggestions(true);
                }
            } catch (error) {
                console.log('Error fetching city suggestions:', error);
            }
        } else {
            setCitySuggestions([]);
            setShowCitySuggestions(false);
        }
    };

    const handleCitySelect = (city) => {
        setData('city', city);
        setShowCitySuggestions(false);
    };

    // Handle state input with autocomplete
    const handleStateInputChange = async (value) => {
        setData('state', value);
        
        if (value.length > 2) {
            try {
                const query = encodeURIComponent(value + ', Bangladesh');
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=5&countrycodes=bd&addressdetails=1&featuretype=state`,
                    {
                        headers: {
                            'User-Agent': 'BloodDonationApp/1.0'
                        }
                    }
                );
                
                if (response.ok) {
                    const cityStateData = await response.json();
                    const states = cityStateData
                        .map(item => {
                            if (item.address) {
                                return item.address.state || item.address.region || item.display_name.split(',')[0];
                            }
                            return item.display_name.split(',')[0];
                        })
                        .filter((state, index, self) => state && self.indexOf(state) === index)
                        .slice(0, 5);
                    setStateSuggestions(states);
                    setShowStateSuggestions(true);
                }
            } catch (error) {
                console.log('Error fetching state suggestions:', error);
            }
        } else {
            setStateSuggestions([]);
            setShowStateSuggestions(false);
        }
    };

    const handleStateSelect = (state) => {
        setData('state', state);
        setShowStateSuggestions(false);
    };

    // Generate Google Maps link with coordinates for exact location
    const getMapLink = () => {
        if (mapCoordinates) {
            // Use coordinates for exact location
            return `https://www.google.com/maps?q=${mapCoordinates.lat},${mapCoordinates.lng}&z=17`;
        }
        const fullAddress = `${data.hospital_address || ''}, ${data.city || ''}, ${data.state || ''}, Bangladesh`.trim();
        if (fullAddress) {
            return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
        }
        return null;
    };

    // Generate Google Maps embed URL with coordinates (free, no API key needed)
    const getMapEmbedUrl = () => {
        if (mapCoordinates) {
            // Use coordinates for exact location in embed (no API key needed for basic embed)
            return `https://www.google.com/maps?q=${mapCoordinates.lat},${mapCoordinates.lng}&hl=en&z=17&output=embed`;
        }
        const fullAddress = `${data.hospital_address || ''}, ${data.city || ''}, ${data.state || ''}, Bangladesh`.trim();
        if (fullAddress) {
            return `https://www.google.com/maps?q=${encodeURIComponent(fullAddress)}&hl=en&z=17&output=embed`;
        }
        return null;
    };

    return (
        <AuthenticatedLayout>
            <Head title="Blood Donation" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Header Section */}
                    <div className="mb-8">
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-600 via-teal-500 to-blue-600 p-8 shadow-2xl">
                            <div className="absolute inset-0 opacity-10">
                                <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-white blur-3xl"></div>
                                <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-white blur-3xl"></div>
                            </div>
                            
                            <div className="relative z-10 text-center">
                                <div className="mb-4 inline-flex rounded-2xl bg-white/20 backdrop-blur-sm p-4">
                                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                <h1 className="text-4xl font-bold text-white mb-2">Blood Donation</h1>
                                <p className="text-white/90 text-lg">Save lives, donate blood</p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid gap-6 mb-8 md:grid-cols-3">
                        <button
                            onClick={() => setShowForm(true)}
                            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-600 via-teal-500 to-blue-600 p-8 text-white shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105"
                        >
                            <div className="relative z-10">
                                <div className="mb-4 inline-flex rounded-xl bg-white/20 backdrop-blur-sm p-3">
                                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold mb-2">Request Blood</h3>
                                <p className="text-white/80 text-sm">Need blood? Fill out the form to request from donors</p>
                            </div>
                        </button>

                        <Link
                            href={route('blood-donation.find-donors')}
                            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-600 p-8 text-white shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105"
                        >
                            <div className="relative z-10">
                                <div className="mb-4 inline-flex rounded-xl bg-white/20 backdrop-blur-sm p-3">
                                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold mb-2">Find Donors</h3>
                                <p className="text-white/80 text-sm">Browse available blood donors in your area</p>
                            </div>
                        </Link>

                        <Link
                            href={route('blood-donation.requests')}
                            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 p-8 text-white shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105"
                        >
                            <div className="relative z-10">
                                <div className="mb-4 inline-flex rounded-xl bg-white/20 backdrop-blur-sm p-3">
                                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold mb-2">View Requests</h3>
                                <p className="text-white/80 text-sm">See all saved blood donation requests</p>
                            </div>
                        </Link>
                    </div>

                    {/* Blood Need Request Form Modal */}
                    {showForm && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                            <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
                                <div className="sticky top-0 rounded-t-2xl bg-gradient-to-r from-cyan-600 via-teal-500 to-blue-600 px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-2xl font-bold text-white">Blood Need Request Form</h2>
                                        <button
                                            onClick={() => {
                                                setShowForm(false);
                                                setSubmitted(false);
                                                reset();
                                                setHospitalSearch('');
                                                setAddressSuggestions([]);
                                                setShowAddressSuggestions(false);
                                                setCitySuggestions([]);
                                                setShowCitySuggestions(false);
                                                setStateSuggestions([]);
                                                setShowStateSuggestions(false);
                                                setMapCoordinates(null);
                                            }}
                                            className="rounded-lg p-2 text-white hover:bg-white/20 transition-colors"
                                        >
                                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="max-h-[70vh] overflow-y-auto p-6">
                                    {submitted ? (
                                        <div className="text-center py-12">
                                            <div className="mb-4 inline-flex rounded-full bg-green-100 p-4">
                                                <svg className="h-12 w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted Successfully!</h3>
                                            <p className="text-gray-600">Your blood request has been submitted. Donors will be notified.</p>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleSubmit} className="space-y-6">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Blood Group Needed <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    value={data.blood_group}
                                                    onChange={(e) => setData('blood_group', e.target.value)}
                                                    required
                                                    className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                                                >
                                                    <option value="">Select Blood Group</option>
                                                    <option value="A+">A+</option>
                                                    <option value="A-">A-</option>
                                                    <option value="B+">B+</option>
                                                    <option value="B-">B-</option>
                                                    <option value="AB+">AB+</option>
                                                    <option value="AB-">AB-</option>
                                                    <option value="O+">O+</option>
                                                    <option value="O-">O-</option>
                                                </select>
                                                {errors.blood_group && <p className="mt-1 text-sm text-red-600">{errors.blood_group}</p>}
                                            </div>

                                            <div className="grid gap-6 md:grid-cols-2">
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                        Units Needed (ml) <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={data.units_needed}
                                                        onChange={(e) => setData('units_needed', e.target.value)}
                                                        required
                                                        min="1"
                                                        className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                                                        placeholder="Enter units needed"
                                                    />
                                                    {errors.units_needed && <p className="mt-1 text-sm text-red-600">{errors.units_needed}</p>}
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                        Urgency <span className="text-red-500">*</span>
                                                    </label>
                                                    <select
                                                        value={data.urgency}
                                                        onChange={(e) => setData('urgency', e.target.value)}
                                                        required
                                                        className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                                                    >
                                                        <option value="normal">Normal</option>
                                                        <option value="urgent">Urgent</option>
                                                        <option value="critical">Critical</option>
                                                    </select>
                                                    {errors.urgency && <p className="mt-1 text-sm text-red-600">{errors.urgency}</p>}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Patient Name <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.patient_name}
                                                    onChange={(e) => setData('patient_name', e.target.value)}
                                                    required
                                                    className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                                                    placeholder="Enter patient name"
                                                />
                                                {errors.patient_name && <p className="mt-1 text-sm text-red-600">{errors.patient_name}</p>}
                                            </div>

                                            <div className="grid gap-6 md:grid-cols-2">
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                        Needed By Date <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={data.needed_by_date}
                                                        onChange={(e) => setData('needed_by_date', e.target.value)}
                                                        required
                                                        min={new Date().toISOString().split('T')[0]}
                                                        className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                                                    />
                                                    {errors.needed_by_date && <p className="mt-1 text-sm text-red-600">{errors.needed_by_date}</p>}
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                        Needed By Time <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="time"
                                                        value={data.needed_by_time}
                                                        onChange={(e) => setData('needed_by_time', e.target.value)}
                                                        required
                                                        className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                                                    />
                                                    {errors.needed_by_time && <p className="mt-1 text-sm text-red-600">{errors.needed_by_time}</p>}
                                                </div>
                                            </div>

                                            <div className="relative">
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Hospital Name <span className="text-red-500">*</span>
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={hospitalSearch}
                                                        onChange={(e) => handleHospitalInputChange(e.target.value)}
                                                        onFocus={() => setShowHospitalSuggestions(true)}
                                                        onBlur={() => {
                                                            setTimeout(() => setShowHospitalSuggestions(false), 200);
                                                        }}
                                                        placeholder="Search or type hospital name..."
                                                        className={`w-full rounded-xl border-2 ${data.hospital_name ? 'border-green-300' : 'border-gray-200'} bg-white px-4 py-3 pr-10 text-sm font-medium text-gray-900 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100`}
                                                    />
                                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                        </svg>
                                                    </div>
                                                    
                                                    {showHospitalSuggestions && hospitalSearch && filteredHospitals.length > 0 && (
                                                        <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                                            {filteredHospitals.map((hospital, index) => (
                                                                <button
                                                                    key={index}
                                                                    type="button"
                                                                    onClick={() => handleHospitalSelect(hospital)}
                                                                    className="w-full text-left px-4 py-3 text-sm text-gray-900 hover:bg-red-50 hover:text-red-600 transition-colors border-b border-gray-100 last:border-b-0"
                                                                >
                                                                    {hospital}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                    
                                                    {showHospitalSuggestions && hospitalSearch && filteredHospitals.length === 0 && (
                                                        <div className="absolute z-50 w-full mt-1 bg-blue-50 border-2 border-blue-200 rounded-xl shadow-lg p-3">
                                                            <p className="text-sm text-blue-700">
                                                                <span className="font-semibold">No matches found.</span> You can continue typing to enter a custom hospital name.
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                                {errors.hospital_name && <p className="mt-1 text-sm text-red-600">{errors.hospital_name}</p>}
                                                {hospitalSearch && !filteredHospitals.some(h => h.toLowerCase() === hospitalSearch.toLowerCase()) && (
                                                    <p className="mt-1 text-xs text-blue-600">You can use this custom hospital name or select from suggestions above</p>
                                                )}
                                            </div>

                                            <div className="relative">
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Hospital Address <span className="text-red-500">*</span>
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        ref={addressInputRef}
                                                        type="text"
                                                        value={data.hospital_address}
                                                        onChange={(e) => handleAddressInputChange(e.target.value)}
                                                        onFocus={() => {
                                                            if (addressSuggestions.length > 0) {
                                                                setShowAddressSuggestions(true);
                                                            }
                                                            // Hide hospital suggestions when manually typing
                                                            setShowHospitalAddressSuggestions(false);
                                                        }}
                                                        onBlur={() => {
                                                            // Delay hiding suggestions to allow click
                                                            setTimeout(() => {
                                                                setShowAddressSuggestions(false);
                                                                setShowHospitalAddressSuggestions(false);
                                                            }, 200);
                                                        }}
                                                        required
                                                        className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                                                        placeholder="Start typing address or select from suggestions"
                                                    />
                                                    {data.hospital_address && (
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                            <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {/* Hospital Address Suggestions Dropdown (when hospital is selected) */}
                                                {showHospitalAddressSuggestions && hospitalAddressSuggestions.length > 0 && (
                                                    <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-xl border-2 border-blue-300 bg-white shadow-xl">
                                                        <div className="px-3 py-2 bg-blue-50 border-b border-blue-200">
                                                            <p className="text-xs font-semibold text-blue-700">
                                                                📍 Select exact address location for {data.hospital_name?.split(',')[0] || 'this hospital'}:
                                                            </p>
                                                        </div>
                                                        {hospitalAddressSuggestions.map((suggestion, index) => (
                                                            <div
                                                                key={index}
                                                                onClick={() => handleHospitalAddressSelect(suggestion)}
                                                                className="cursor-pointer px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors border-b border-gray-100 last:border-b-0"
                                                            >
                                                                <div className="flex items-start gap-2">
                                                                    <svg className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    </svg>
                                                                    <div className="flex-1">
                                                                        <div className="font-medium text-gray-900">{suggestion.address || suggestion.fullAddress}</div>
                                                                        {suggestion.city && suggestion.state && (
                                                                            <div className="text-xs text-gray-500 mt-0.5">{suggestion.city}, {suggestion.state}</div>
                                                                        )}
                                                                        {suggestion.description && (
                                                                            <div className="text-xs text-gray-400 mt-0.5">{suggestion.description}</div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                
                                                {/* Regular Address Suggestions Dropdown (when typing manually) */}
                                                {!showHospitalAddressSuggestions && showAddressSuggestions && addressSuggestions.length > 0 && (
                                                    <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-xl border-2 border-gray-200 bg-white shadow-xl">
                                                        {addressSuggestions.map((address, index) => (
                                                            <div
                                                                key={index}
                                                                onClick={() => handleAddressSelect(address)}
                                                                className="cursor-pointer px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors border-b border-gray-100 last:border-b-0"
                                                            >
                                                                <div className="flex items-start gap-2">
                                                                    <svg className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    </svg>
                                                                    <span className="flex-1">{address}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                
                                                {errors.hospital_address && <p className="mt-1 text-sm text-red-600">{errors.hospital_address}</p>}
                                                {data.hospital_address && !showAddressSuggestions && (
                                                    <p className="mt-1 text-xs text-gray-500">You can edit this address if needed</p>
                                                )}
                                            </div>

                                            <div className="grid gap-6 md:grid-cols-2">
                                                <div className="relative">
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                        City <span className="text-red-500">*</span>
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            ref={cityInputRef}
                                                            type="text"
                                                            value={data.city}
                                                            onChange={(e) => handleCityInputChange(e.target.value)}
                                                            onFocus={() => {
                                                                if (citySuggestions.length > 0) {
                                                                    setShowCitySuggestions(true);
                                                                }
                                                            }}
                                                            onBlur={() => {
                                                                setTimeout(() => setShowCitySuggestions(false), 200);
                                                            }}
                                                            required
                                                            className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                                                            placeholder="Start typing city or select from suggestions"
                                                        />
                                                        {data.city && (
                                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                                <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {/* City Suggestions Dropdown */}
                                                    {showCitySuggestions && citySuggestions.length > 0 && (
                                                        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-xl border-2 border-gray-200 bg-white shadow-xl">
                                                            {citySuggestions.map((city, index) => (
                                                                <div
                                                                    key={index}
                                                                    onClick={() => handleCitySelect(city)}
                                                                    className="cursor-pointer px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors border-b border-gray-100 last:border-b-0"
                                                                >
                                                                    <div className="flex items-start gap-2">
                                                                        <svg className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                                        </svg>
                                                                        <span className="flex-1">{city}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    
                                                    {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
                                                </div>

                                                <div className="relative">
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                        State
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            ref={stateInputRef}
                                                            type="text"
                                                            value={data.state}
                                                            onChange={(e) => handleStateInputChange(e.target.value)}
                                                            onFocus={() => {
                                                                if (stateSuggestions.length > 0) {
                                                                    setShowStateSuggestions(true);
                                                                }
                                                            }}
                                                            onBlur={() => {
                                                                setTimeout(() => setShowStateSuggestions(false), 200);
                                                            }}
                                                            className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                                                            placeholder="Start typing state or select from suggestions"
                                                        />
                                                        {data.state && (
                                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                                <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {/* State Suggestions Dropdown */}
                                                    {showStateSuggestions && stateSuggestions.length > 0 && (
                                                        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-xl border-2 border-gray-200 bg-white shadow-xl">
                                                            {stateSuggestions.map((state, index) => (
                                                                <div
                                                                    key={index}
                                                                    onClick={() => handleStateSelect(state)}
                                                                    className="cursor-pointer px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors border-b border-gray-100 last:border-b-0"
                                                                >
                                                                    <div className="flex items-start gap-2">
                                                                        <svg className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                        </svg>
                                                                        <span className="flex-1">{state}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    
                                                    {errors.state && <p className="mt-1 text-sm text-red-600">{errors.state}</p>}
                                                </div>
                                            </div>
                                            
                                            {/* Embedded Map Showing Exact Location */}
                                            {getMapEmbedUrl() && (
                                                <div className="space-y-3">
                                                    <div className="rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg" style={{ height: '400px' }}>
                                                        <iframe
                                                            width="100%"
                                                            height="100%"
                                                            style={{ border: 0 }}
                                                            loading="lazy"
                                                            allowFullScreen
                                                            referrerPolicy="no-referrer-when-downgrade"
                                                            src={getMapEmbedUrl()}
                                                            title="Hospital Location Map"
                                                        ></iframe>
                                                    </div>
                                                    <div className="flex items-center justify-end">
                                                        <a
                                                            href={getMapLink()}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-2 rounded-lg border border-blue-500 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 transition-colors"
                                                        >
                                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                            </svg>
                                                            Open in Google Maps
                                                        </a>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="grid gap-6 md:grid-cols-2">
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                        Contact Phone <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="tel"
                                                        value={data.contact_phone}
                                                        onChange={(e) => setData('contact_phone', e.target.value)}
                                                        required
                                                        className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 focus:border-red-400 focus:ring-4 focus:ring-red-100"
                                                        placeholder="e.g., +8801XXXXXXXXX"
                                                    />
                                                    {errors.contact_phone && <p className="mt-1 text-sm text-red-600">{errors.contact_phone}</p>}
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                        Contact Email (Optional)
                                                    </label>
                                                    <input
                                                        type="email"
                                                        value={data.contact_email}
                                                        onChange={(e) => setData('contact_email', e.target.value)}
                                                        className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 focus:border-red-400 focus:ring-4 focus:ring-red-100"
                                                        placeholder="e.g., example@email.com"
                                                    />
                                                    {errors.contact_email && <p className="mt-1 text-sm text-red-600">{errors.contact_email}</p>}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Additional Information / Blood Need Details <span className="text-red-500">*</span>
                                                </label>
                                                <textarea
                                                    value={data.additional_info}
                                                    onChange={(e) => setData('additional_info', e.target.value)}
                                                    required
                                                    rows="2"
                                                    className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                                                    placeholder="Describe the blood need, patient condition, or special requirements..."
                                                />
                                                {errors.additional_info && <p className="mt-1 text-sm text-red-600">{errors.additional_info}</p>}
                                                <p className="mt-2 text-xs text-gray-500">
                                                    <span className="font-semibold">Required:</span> Describe the blood need, patient condition, or special requirements.
                                                </p>
                                            </div>

                                            <div className="flex gap-4 pt-4">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowForm(false);
                                                        reset();
                                                        setHospitalSearch('');
                                                        setAddressSuggestions([]);
                                                        setShowAddressSuggestions(false);
                                                    }}
                                                    className="flex-1 rounded-xl border-2 border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={processing}
                                                    className="flex-1 rounded-xl bg-gradient-to-r from-cyan-600 via-teal-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                                                >
                                                    {processing ? 'Submitting...' : 'Submit Request'}
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}



