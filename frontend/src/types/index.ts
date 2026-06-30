export interface User {
    id: string;
    name: string;
    fullName?: string;
    email: string;
    role: 'Student' | 'Teacher' | 'Admin';
    dateOfBirth?: string;
    avatarUrl?: string;
    userCode?: string;
}

export interface Class {
    id: string;
    name: string;
    description: string;
    teacher: User;
    studentCount?: number;
}

export interface Announcement {
    id: string;
    title: string;
    content: string;
    createdAt: string;
}

export interface Assignment {
    id: string;
    title: string;
    description: string;
    dueDate: string;
    hasSubmitted?: boolean;
    filePath?: string;
    fileName?: string;
}

export interface Lecture {
    id: number;
    title: string;
    content?: string;
    filePath?: string;
    fileName?: string;
    createdAt: string;
}

export interface Submission {
    id: number;
    filePath: string;
    fileName: string;
    fileSize: number;
    submittedAt: string;
    grade?: number;
    feedback?: string;
    student?: User;
}
