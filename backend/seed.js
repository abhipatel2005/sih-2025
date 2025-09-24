import { supabase } from "./utils/supabaseClient.js";
import { faker } from "@faker-js/faker";

async function seed() {
    try {
        // ---- 1. Insert 20 Schools ----
        let schoolsData = [];
        for (let i = 1; i <= 20; i++) {
            schoolsData.push({
                name: `${faker.company.name()} School`,
                address: faker.location.streetAddress(),
                district: faker.location.city(),
                state: "Punjab",
            });
        }

        const { data: schools, error: schoolError } = await supabase
            .from("schools")
            .insert(schoolsData)
            .select();

        if (schoolError) throw schoolError;
        console.log("✅ Inserted Schools");

        // ---- 2. Insert Students (30 per class × 3 classes = 90 per school) ----
        let studentsData = [];
        schools.forEach((school) => {
            [6, 7, 8].forEach((classNum) => {
                for (let i = 1; i <= 30; i++) {
                    studentsData.push({
                        school_id: school.id,
                        name: faker.person.fullName(),
                        roll_no: `${classNum}${i}`,
                        class: classNum,
                        section: faker.helpers.arrayElement(["A", "B", "C"]),
                        rfid_tag: faker.string.alphanumeric(12),
                        category: faker.helpers.arrayElement([
                            "General",
                            "OBC",
                            "SC",
                            "ST",
                        ]),
                        gender: faker.helpers.arrayElement(["Male", "Female"]),
                    });
                }
            });
        });

        const { data: students, error: studentError } = await supabase
            .from("students")
            .insert(studentsData)
            .select();

        if (studentError) throw studentError;
        console.log("✅ Inserted Students");

        // ---- 3. Insert Attendance (7 days per student) ----
        let attendanceData = [];
        const today = new Date();

        students.forEach((student) => {
            for (let d = 0; d < 7; d++) {
                const date = new Date(today);
                date.setDate(today.getDate() - d);

                attendanceData.push({
                    student_id: student.id,
                    date: date.toISOString().split("T")[0],
                    status: faker.helpers.arrayElement(["present", "absent", "late"]),
                });
            }
        });

        // Insert in chunks (Supabase insert limit safety)
        const chunkSize = 1000;
        for (let i = 0; i < attendanceData.length; i += chunkSize) {
            const chunk = attendanceData.slice(i, i + chunkSize);
            const { error: attendanceError } = await supabase
                .from("attendance")
                .insert(chunk);

            if (attendanceError) throw attendanceError;
            console.log(
                `✅ Inserted ${i + chunk.length}/${attendanceData.length} attendance records`
            );
        }

        console.log("🎉 Dummy data seeding completed successfully!");
    } catch (err) {
        console.error("❌ Error seeding data:", err.message);
    }
}

seed();
