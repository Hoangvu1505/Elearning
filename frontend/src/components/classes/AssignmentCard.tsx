import React from 'react';

interface AssignmentCardProps {
    id: string;
    title: string;
    dueDate: string;
}

const AssignmentCard: React.FC<AssignmentCardProps> = ({ title, dueDate }) => {
    return (
        <div className="assignment-card glass-panel">
            <h4>{title}</h4>
            <p>Due: {dueDate}</p>
            <button className="btn-primary">View Assignment</button>
        </div>
    );
};

export default AssignmentCard;
