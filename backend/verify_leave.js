const fetch = require('node-fetch');

const BASE_URL = "http://localhost:5000/api";
let token = "";
let staffId = "";
let leaveId = "";

async function verifyLeaveApproval() {
    console.log("--- Starting Leave Approval Verification ---");

    try {
        // 1. Login as Admin to get token and staff ID
        const adminLogin = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "admin@beautyhut.com", password: "password123" }) // Assuming these credentials
        });
        const adminData = await adminLogin.json();
        token = adminData.token;
        console.log("1. Logged in as Admin");

        // Get staff members
        const usersRes = await fetch(`${BASE_URL}/users?role=STAFF`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const users = await usersRes.json();
        const staff = users.data[0];
        staffId = staff.id;
        console.log(`2. Found staff member: ${staff.name} (${staffId})`);

        // 3. Request Leave (should be PENDING)
        // Request as admin on behalf of staff for simplicity (or login as staff)
        console.log("3. Requesting Leave...");
        const leaveRes = await fetch(`${BASE_URL}/users/${staffId}/time-off`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                startDate: "2026-03-01",
                endDate: "2026-03-05",
                reason: "Spring Break"
            })
        });
        const leaveData = await leaveRes.json();
        leaveId = leaveData.data.id;
        console.log(`- Request Created. Status: ${leaveData.data.status}`);

        if (leaveData.data.status !== "PENDING") {
            throw new Error("Initial status should be PENDING");
        }

        // 4. Admin Approves Leave
        console.log(`4. Admin Approving Leave (ID: ${leaveId})...`);
        const approveRes = await fetch(`${BASE_URL}/users/time-off/${leaveId}/status`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ status: "APPROVED" })
        });
        const approveData = await approveRes.json();
        console.log(`- Update Response: ${approveData.message}`);

        // 5. Verify status is APPROVED
        const verifyRes = await fetch(`${BASE_URL}/users/${staffId}/time-off`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const verifyData = await verifyRes.json();
        const updatedLeave = verifyData.data.find(l => l.id === leaveId);
        console.log(`5. Verified Status: ${updatedLeave.status}`);

        if (updatedLeave.status === "APPROVED") {
            console.log("✅ Leave Approval Workflow Verified Successfully!");
        } else {
            console.log("❌ Leave Approval Workflow Verification Failed.");
        }

    } catch (error) {
        console.error("Error during verification:", error);
    }
}

verifyLeaveApproval();
