
INSERT INTO schools (name, district, state) VALUES
('Sunrise Public School', 'Mumbai', 'Maharashtra'),
('Green Valley High School', 'Delhi', 'Delhi'),
('St. Mary''s Convent School', 'Bangalore', 'Karnataka'),
('Blue Diamond School', 'Chennai', 'Tamil Nadu'),
('Golden Eagle International School', 'Pune', 'Maharashtra'),
('River View Academy', 'Hyderabad', 'Telangana'),
('Mount Everest School', 'Kolkata', 'West Bengal'),
('Rainbow Children School', 'Jaipur', 'Rajasthan'),
('Crystal Palace School', 'Ahmedabad', 'Gujarat'),
('Bright Future Academy', 'Lucknow', 'Uttar Pradesh');

-- Create a temporary function to generate dummy data
CREATE OR REPLACE FUNCTION generate_dummy_data()
RETURNS VOID AS $$
DECLARE
    school_rec RECORD;
    school_counter INTEGER := 1;
    user_counter INTEGER := 1;
    attendance_date DATE;
    user_id_var UUID;
    attendance_time TIME;
    blood_groups TEXT[] := ARRAY['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    genders TEXT[] := ARRAY['Male', 'Female'];
    categories TEXT[] := ARRAY['General', 'OBC', 'SC', 'ST'];
    standards TEXT[] := ARRAY['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];
    first_names TEXT[] := ARRAY['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
                                'Ananya', 'Diya', 'Priya', 'Kavya', 'Aadhya', 'Saanvi', 'Kiara', 'Anika', 'Riya', 'Navya',
                                'Rohit', 'Amit', 'Suresh', 'Rajesh', 'Prakash', 'Dinesh', 'Ramesh', 'Mahesh', 'Ganesh', 'Naresh',
                                'Sunita', 'Meera', 'Kavita', 'Rekha', 'Geeta', 'Sita', 'Rita', 'Nita', 'Lata', 'Gita'];
    last_names TEXT[] := ARRAY['Sharma', 'Verma', 'Gupta', 'Singh', 'Kumar', 'Yadav', 'Patel', 'Jain', 'Agarwal', 'Mishra',
                               'Shah', 'Mehta', 'Desai', 'Modi', 'Joshi', 'Pandey', 'Tiwari', 'Chauhan', 'Saxena', 'Bansal'];
    districts TEXT[] := ARRAY['Central', 'North', 'South', 'East', 'West'];
BEGIN
    -- Loop through each school
    FOR school_rec IN SELECT school_id, name FROM schools ORDER BY name
    LOOP
        RAISE NOTICE 'Processing school: %', school_rec.name;
        
        -- Insert 1 Principal for each school
        INSERT INTO users (
            name, 
            rfid_tag, 
            role, 
            email, 
            phone, 
            category, 
            gender, 
            password, 
            dob, 
            address, 
            blood_group, 
            aadhar_id,
            school_id
        ) VALUES (
            first_names[1 + (user_counter % array_length(first_names, 1))] || ' ' || last_names[1 + (user_counter % array_length(last_names, 1))],
            'RFID' || LPAD(user_counter::TEXT, 6, '0'),
            'principal',
            'principal' || school_counter || '@' || LOWER(REPLACE(school_rec.name, ' ', '')) || '.edu',
            '+91' || LPAD((7000000000 + user_counter)::TEXT, 10, '0'),
            categories[1 + (user_counter % array_length(categories, 1))],
            genders[1 + (user_counter % array_length(genders, 1))],
            '$2b$10$hashedpassword' || user_counter, -- Mock hashed password
            CURRENT_DATE - INTERVAL '30 years' - (user_counter % 10 || ' years')::INTERVAL,
            (user_counter % 999 + 1) || ', ' || districts[1 + (user_counter % array_length(districts, 1))] || ' District, ' || school_rec.name || ' Area',
            blood_groups[1 + (user_counter % array_length(blood_groups, 1))],
            LPAD((100000000000 + user_counter)::TEXT, 12, '0'),
            school_rec.school_id
        );
        user_counter := user_counter + 1;
        
        -- Insert 10 Teachers for each school
        FOR i IN 1..10
        LOOP
            INSERT INTO users (
                name, 
                rfid_tag, 
                role, 
                email, 
                phone, 
                category, 
                gender, 
                password, 
                dob, 
                address, 
                blood_group, 
                aadhar_id,
                school_id
            ) VALUES (
                first_names[1 + (user_counter % array_length(first_names, 1))] || ' ' || last_names[1 + (user_counter % array_length(last_names, 1))],
                'RFID' || LPAD(user_counter::TEXT, 6, '0'),
                'teacher',
                'teacher' || user_counter || '@' || LOWER(REPLACE(school_rec.name, ' ', '')) || '.edu',
                '+91' || LPAD((7000000000 + user_counter)::TEXT, 10, '0'),
                categories[1 + (user_counter % array_length(categories, 1))],
                genders[1 + (user_counter % array_length(genders, 1))],
                '$2b$10$hashedpassword' || user_counter,
                CURRENT_DATE - INTERVAL '25 years' - (user_counter % 15 || ' years')::INTERVAL,
                (user_counter % 999 + 1) || ', ' || districts[1 + (user_counter % array_length(districts, 1))] || ' District, ' || school_rec.name || ' Area',
                blood_groups[1 + (user_counter % array_length(blood_groups, 1))],
                LPAD((100000000000 + user_counter)::TEXT, 12, '0'),
                school_rec.school_id
            );
            user_counter := user_counter + 1;
        END LOOP;
        
        -- Insert 100 Students for each school
        FOR i IN 1..100
        LOOP
            INSERT INTO users (
                name, 
                rfid_tag, 
                role, 
                email, 
                phone, 
                category, 
                gender, 
                std,
                password, 
                dob, 
                address, 
                blood_group, 
                aadhar_id,
                school_id
            ) VALUES (
                first_names[1 + (user_counter % array_length(first_names, 1))] || ' ' || last_names[1 + (user_counter % array_length(last_names, 1))],
                'RFID' || LPAD(user_counter::TEXT, 6, '0'),
                'student',
                'student' || user_counter || '@' || LOWER(REPLACE(school_rec.name, ' ', '')) || '.edu',
                '+91' || LPAD((8000000000 + user_counter)::TEXT, 10, '0'),
                categories[1 + (user_counter % array_length(categories, 1))],
                genders[1 + (user_counter % array_length(genders, 1))],
                standards[1 + (user_counter % array_length(standards, 1))],
                '$2b$10$hashedpassword' || user_counter,
                CURRENT_DATE - INTERVAL '5 years' - (user_counter % 18 || ' years')::INTERVAL,
                (user_counter % 999 + 1) || ', ' || districts[1 + (user_counter % array_length(districts, 1))] || ' District, ' || school_rec.name || ' Area',
                blood_groups[1 + (user_counter % array_length(blood_groups, 1))],
                LPAD((200000000000 + user_counter)::TEXT, 12, '0'),
                school_rec.school_id
            );
            user_counter := user_counter + 1;
        END LOOP;
        
        school_counter := school_counter + 1;
    END LOOP;
    
    RAISE NOTICE 'Total users inserted: %', user_counter - 1;
    
    -- Now insert attendance data for the past week (7 days)
    RAISE NOTICE 'Starting attendance data insertion...';
    
    FOR attendance_date IN SELECT generate_series(
        CURRENT_DATE - INTERVAL '6 days',
        CURRENT_DATE,
        '1 day'::interval
    )::date
    LOOP
        RAISE NOTICE 'Processing attendance for date: %', attendance_date;
        
        -- Insert attendance for each user (with 90% attendance rate to make it realistic)
        FOR user_id_var IN SELECT id FROM users
        LOOP
            -- 90% chance of attendance (skip weekend if needed)
            IF EXTRACT(DOW FROM attendance_date) NOT IN (0, 6) AND random() > 0.1 THEN
                -- Generate random attendance time between 8:00 AM and 9:30 AM
                attendance_time := TIME '08:00:00' + (random() * INTERVAL '90 minutes');
                
                INSERT INTO attendance (
                    user_id,
                    date,
                    timestamp
                ) VALUES (
                    user_id_var,
                    attendance_date,
                    attendance_date + attendance_time
                );
            END IF;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Attendance data insertion completed.';
END;
$$ LANGUAGE plpgsql;

-- Execute the function to generate all dummy data
SELECT generate_dummy_data();

-- Clean up: Drop the temporary function
DROP FUNCTION generate_dummy_data();

-- Display summary statistics
SELECT 
    'Schools' as table_name,
    COUNT(*) as record_count
FROM schools
UNION ALL
SELECT 
    'Users - Total' as table_name,
    COUNT(*) as record_count
FROM users
UNION ALL
SELECT 
    'Users - Students' as table_name,
    COUNT(*) as record_count
FROM users WHERE role = 'student'
UNION ALL
SELECT 
    'Users - Teachers' as table_name,
    COUNT(*) as record_count
FROM users WHERE role = 'teacher'
UNION ALL
SELECT 
    'Users - Principals' as table_name,
    COUNT(*) as record_count
FROM users WHERE role = 'principal'
UNION ALL
SELECT 
    'Attendance Records' as table_name,
    COUNT(*) as record_count
FROM attendance
ORDER BY table_name;

-- Display sample data from each table
SELECT 'Sample Schools:' as info;
SELECT school_id, name, district, state FROM schools LIMIT 3;

SELECT 'Sample Users by Role:' as info;
SELECT id, name, role, email, std, school_id FROM users 
WHERE role IN ('student', 'teacher', 'principal')
ORDER BY role, name LIMIT 10;

SELECT 'Sample Attendance Data:' as info;
SELECT a.id, u.name, u.role, a.date, a.timestamp, s.name as school_name
FROM attendance a
JOIN users u ON a.user_id = u.id
JOIN schools s ON u.school_id = s.school_id
ORDER BY a.date DESC, a.timestamp DESC
LIMIT 10;

SELECT 'Attendance Summary by Date:' as info;
SELECT 
    a.date,
    COUNT(*) as total_attendance,
    COUNT(CASE WHEN u.role = 'student' THEN 1 END) as student_attendance,
    COUNT(CASE WHEN u.role = 'teacher' THEN 1 END) as teacher_attendance,
    COUNT(CASE WHEN u.role = 'principal' THEN 1 END) as principal_attendance
FROM attendance a
JOIN users u ON a.user_id = u.id
GROUP BY a.date
ORDER BY a.date DESC;
