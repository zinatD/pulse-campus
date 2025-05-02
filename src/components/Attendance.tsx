import { useState, useEffect } from "react";
import axios from "axios";
import "./Attendance.css";

interface AttendanceRecord {
    userId: string;
    status: string;
}

function Attendance() {
    const [status, setStatus] = useState<string>("");
    const [userId, setUserId] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [feedback, setFeedback] = useState<{message: string; type: "success" | "error" | null}>({
        message: "",
        type: null
    });

    // Fetch user ID on component mount
    useEffect(() => {
        // In a real application, you'd fetch this from an auth context or API
        // Example: fetchCurrentUser().then(user => setUserId(user.id))
        setUserId("12345");
    }, []);

    const markAttendance = async () => {
        // Clear previous feedback
        setFeedback({ message: "", type: null });
        
        if (!status) {
            setFeedback({ message: "Please select an attendance status", type: "error" });
            return;
        }
        
        setIsLoading(true);
        
        try {
            const data: AttendanceRecord = {
                userId,
                status
            };
            const response = await axios.post("http://localhost:5000/api/attendance", data, {
                headers: {
                    "Content-Type": "application/json",
                },
            });

            setFeedback({ 
                message: response.data.message || "Attendance marked successfully", 
                type: "success" 
            });

            setStatus("");

        } catch (error: any) {
            console.error("Error marking attendance:", error);
            
            // More specific error messages based on the error
            const errorMessage = error.response?.data?.message || 
                                "Error marking attendance. Please try again.";
                                
            setFeedback({ message: errorMessage, type: "error" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="attendance-container">
            <h2>Mark Attendance</h2>
            
            {/* Feedback message */}
            {feedback.message && (
                <div className={`feedback ${feedback.type}`}>
                    {feedback.message}
                </div>
            )}
            
            <div className="form-group">
                <label htmlFor="status-select">Attendance Status:</label>
                <select 
                    id="status-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    disabled={isLoading}
                >
                    <option value="">Select Status</option>
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Late">Late</option>
                </select>
            </div>
            
            <button 
                onClick={markAttendance} 
                disabled={isLoading || !status}
                className={isLoading ? "button-loading" : ""}
            >
                {isLoading ? "Submitting..." : "Submit"}
            </button>
        </div>
    );

 
}

export default Attendance;
