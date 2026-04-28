import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ClassCard from '../components/classes/ClassCard';
import api from '../services/api';
import { Class } from '../types';

const ClassListPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [classes, setClasses] = useState<Class[]>([]);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get('/classes');
        setClasses(res.data);
      } catch (error) {
        console.error('Failed to fetch classes', error);
      }
    };
    fetchClasses();
  }, []);

  const filteredClasses = classes.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.description?.toLowerCase().includes(search.toLowerCase()) ||
    (c.teacher && (
      (c.teacher.fullName && c.teacher.fullName.toLowerCase().includes(search.toLowerCase())) || 
      (c.teacher.name && c.teacher.name.toLowerCase().includes(search.toLowerCase()))
    ))
  );

  return (
    <div>
      <div className="search-container mt-8">
        <input 
          type="text" 
          className="search-input" 
          placeholder="Tìm kiếm khóa học" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="search-btn">&#128269;</button>
      </div>

      <h2 className="section-title">Khóa học của tôi</h2>
      
      <div className="mb-6">
        {filteredClasses.length > 0 ? (
          filteredClasses.map(c => (
            <ClassCard key={c.id} id={c.id} name={c.name} description={c.description} teacher={c.teacher?.fullName || c.teacher?.name} />
          ))
        ) : (
          <p className="text-secondary text-center" style={{ padding: '2rem', backgroundColor: 'white', border: '1px solid var(--border-color)' }}>Không tìm thấy khóa học nào phù hợp.</p>
        )}
      </div>
    </div>
  );
};

export default ClassListPage;
