import React from 'react';
import { Link } from 'react-router-dom';

interface ClassCardProps {
  id: string;
  name: string;
  description: string;
  teacher?: string;
}

const ClassCard: React.FC<ClassCardProps> = ({ id, name, description, teacher }) => {
  return (
    <div className="course-card">
      <Link to={`/classes/${id}`} style={{ textDecoration: 'none' }}>
        <h3 className="course-card-title">{name}</h3>
      </Link>
      <div className="course-card-meta">
        {teacher && (
          <p style={{ margin: 0 }}>
            <span className="label">Giảng viên:</span> <Link to="#">{teacher}</Link>
          </p>
        )}
        <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>{description}</p>
      </div>
    </div>
  );
};

export default ClassCard;
