import React, { useState, useEffect } from 'react';
import { 
  TeacherUser, 
  AttendanceSession, 
  Department, 
  ClassItem, 
  StudentItem, 
  TimetableSlot, 
  AssignmentItem, 
  SubmissionItem, 
  MaterialItem, 
  ManagerFeedback, 
  Announcement,
  PasswordResetRequest,
  BroadcastQR,
  ActiveTab
} from './types';
import {
  loadUsers,
  saveUsers,
  loadAttendanceRecords,
  saveAttendanceRecords,
  loadDepartments,
  saveDepartments,
  loadClasses,
  saveClasses,
  loadStudents,
  saveStudents,
  loadTimetable,
  saveTimetable,
  loadAssignments,
  saveAssignments,
  loadSubmissions,
  saveSubmissions,
  loadMaterials,
  saveMaterials,
  loadFeedback,
  saveFeedback,
  loadAnnouncements,
  saveAnnouncements,
  loadPasswordResetRequests,
  savePasswordResetRequests,
  loadBroadcastQR,
  saveBroadcastQR,
  loadCurrentUser,
  saveCurrentUser,
  loadMainGateLocked,
  saveMainGateLocked,
  clearAllAttendanceRecords,
  getSavedSchoolName,
  saveSchoolName,
  storage
} from './lib/storage';
import { hashPassword } from './lib/utils';

// UI Components
import { LoginView } from './components/LoginView';
import { TopHeader } from './components/TopHeader';
import { Sidebar } from './components/Sidebar';
import { ManagerDashboardView } from './components/ManagerDashboardView';
import { ManagerAttendanceView } from './components/ManagerAttendanceView';
import { ManagerTeachersView } from './components/ManagerTeachersView';
import { ManagerDepartmentsView } from './components/ManagerDepartmentsView';
import { QRStationPortalView } from './components/QRStationPortalView';
import { SchoolEntranceKioskModal } from './components/SchoolEntranceKioskModal';
import { QRScannerModal } from './components/QRScannerModal';
import { FeedbackModal } from './components/FeedbackModal';
import { FeedbackView } from './components/FeedbackView';
import { AnnouncementsView } from './components/AnnouncementsView';
import { DashboardView } from './components/DashboardView';
import { AttendanceView } from './components/AttendanceView';
import { ClassesView } from './components/ClassesView';
import { StudentsView } from './components/StudentsView';
import { TimetableScheduleView } from './components/TimetableScheduleView';
import { AssignmentsView } from './components/AssignmentsView';
import { SubmissionsView } from './components/SubmissionsView';
import { GradesView } from './components/GradesView';
import { MaterialsView } from './components/MaterialsView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { ProfileView } from './components/ProfileView';

export function App() {
  const todayDateStr = '2026-08-21';
  const todayDateFormatted = 'August 21, 2026';

  // Primary State
  const [currentUser, setCurrentUser] = useState<TeacherUser | null>(() => loadCurrentUser());
  const [users, setUsers] = useState<TeacherUser[]>(() => loadUsers());
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceSession[]>(() => loadAttendanceRecords());
  const [departments, setDepartments] = useState<Department[]>(() => loadDepartments());
  const [classes, setClasses] = useState<ClassItem[]>(() => loadClasses());
  const [students, setStudents] = useState<StudentItem[]>(() => loadStudents());
  const [timetable, setTimetable] = useState<TimetableSlot[]>(() => loadTimetable());
  const [assignments, setAssignments] = useState<AssignmentItem[]>(() => loadAssignments());
  const [submissions, setSubmissions] = useState<SubmissionItem[]>(() => loadSubmissions());
  const [materials, setMaterials] = useState<MaterialItem[]>(() => loadMaterials());
  const [feedbacks, setFeedbacks] = useState<ManagerFeedback[]>(() => loadFeedback());
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => loadAnnouncements());
  const [passwordResets, setPasswordResets] = useState<PasswordResetRequest[]>(() => loadPasswordResetRequests());
  const [broadcastQR, setBroadcastQR] = useState<BroadcastQR | null>(() => loadBroadcastQR());
  const [isStationLocked, setIsStationLocked] = useState<boolean>(() => loadMainGateLocked());
  const [isAutoCreateQREnabled, setIsAutoCreateQREnabled] = useState<boolean>(() => storage.getAutoCreateQREnabled());
  const [schoolName, setSchoolName] = useState<string>(() => getSavedSchoolName());

  // Active Tab & Navigation
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    const user = loadCurrentUser();
    if (!user) return 'login';
    if (user.role === 'manager') return 'manager_dashboard';
    if (user.role === 'qr_station') return 'qr_station';
    return 'dashboard';
  });

  // Modals
  const [isKioskOpen, setIsKioskOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sync state changes to storage
  useEffect(() => {
    saveSchoolName(schoolName);
  }, [schoolName]);
  useEffect(() => {
    saveCurrentUser(currentUser);
  }, [currentUser]);

  useEffect(() => {
    saveUsers(users);
  }, [users]);

  useEffect(() => {
    saveAttendanceRecords(attendanceRecords);
  }, [attendanceRecords]);

  useEffect(() => {
    saveDepartments(departments);
  }, [departments]);

  useEffect(() => {
    saveClasses(classes);
  }, [classes]);

  useEffect(() => {
    saveStudents(students);
  }, [students]);

  useEffect(() => {
    saveTimetable(timetable);
  }, [timetable]);

  useEffect(() => {
    saveAssignments(assignments);
  }, [assignments]);

  useEffect(() => {
    saveSubmissions(submissions);
  }, [submissions]);

  useEffect(() => {
    saveMaterials(materials);
  }, [materials]);

  useEffect(() => {
    saveFeedback(feedbacks);
  }, [feedbacks]);

  useEffect(() => {
    saveAnnouncements(announcements);
  }, [announcements]);

  useEffect(() => {
    savePasswordResetRequests(passwordResets);
  }, [passwordResets]);

  useEffect(() => {
    saveBroadcastQR(broadcastQR);
  }, [broadcastQR]);

  useEffect(() => {
    saveMainGateLocked(isStationLocked);
  }, [isStationLocked]);

  // Handle Login
  const handleLogin = (user: TeacherUser) => {
    setCurrentUser(user);
    if (user.role === 'manager') {
      setActiveTab('manager_dashboard');
    } else if (user.role === 'qr_station') {
      setActiveTab('qr_station');
    } else {
      setActiveTab('dashboard');
    }
  };

  // Handle Logout
  const handleLogout = () => {
    setCurrentUser(null);
    saveCurrentUser(null);
    setActiveTab('login');
    setIsKioskOpen(false);
    setIsScannerOpen(false);
    setIsFeedbackModalOpen(false);
    setIsMobileMenuOpen(false);
  };

  // Check if current logged-in teacher has already scanned for today
  const hasTeacherScannedToday = Boolean(
    currentUser &&
    attendanceRecords.some(
      r => r.date === todayDateStr && (r.teacherId === currentUser.employeeId || r.teacherName === currentUser.name)
    )
  );

  // QR Creation, Auto-Creation & Stop Actions
  const handlePostTodayQR = () => {
    const timestamp = Date.now();
    const token = `EDUSCHOOL-MGR-${todayDateStr}-${timestamp}`;
    const newQR: BroadcastQR = {
      id: `qr-${timestamp}`,
      token,
      generatedDate: todayDateStr,
      generatedAt: timestamp,
      expiresAt: timestamp + 24 * 60 * 60 * 1000, // Valid for today
      generatedByRole: 'manager',
      isActive: true,
      label: "Main Gate - Entrance Station #1 Official QR"
    };

    setBroadcastQR(newQR);
  };

  const handleStopQR = () => {
    if (broadcastQR) {
      const stoppedQR: BroadcastQR = {
        ...broadcastQR,
        isActive: false
      };
      setBroadcastQR(stoppedQR);
    }
  };

  const handleRegenerateTodayQR = () => {
    const timestamp = Date.now();
    const token = `EDUSCHOOL-MGR-${todayDateStr}-${timestamp}-REGEN`;
    const updatedQR: BroadcastQR = {
      id: `qr-${timestamp}`,
      token,
      generatedDate: todayDateStr,
      generatedAt: timestamp,
      expiresAt: timestamp + 24 * 60 * 60 * 1000,
      generatedByRole: 'manager',
      isActive: true,
      label: "Main Gate - Entrance Station #1 Official QR (Updated)"
    };

    setBroadcastQR(updatedQR);
  };

  // Auto create QR effect when enabled
  useEffect(() => {
    if (isAutoCreateQREnabled) {
      if (!broadcastQR || !broadcastQR.isActive || broadcastQR.generatedDate !== todayDateStr) {
        const timestamp = Date.now();
        const token = `EDUSCHOOL-MGR-${todayDateStr}-${timestamp}-AUTO`;
        const autoQR: BroadcastQR = {
          id: `qr-${timestamp}`,
          token,
          generatedDate: todayDateStr,
          generatedAt: timestamp,
          expiresAt: timestamp + 24 * 60 * 60 * 1000,
          generatedByRole: 'manager',
          isActive: true,
          label: "Main Gate - Entrance Station #1 Official QR (Auto)"
        };
        setBroadcastQR(autoQR);
      }
    }
  }, [isAutoCreateQREnabled, todayDateStr]);

  // Teacher QR Scan Attendance Logging (Strict 1 scan/day limit)
  const handleScanAttendance = (scannedToken: string): boolean => {
    if (!currentUser || currentUser.role !== 'teacher') return false;

    // Check if teacher has already scanned today
    if (hasTeacherScannedToday) {
      return false;
    }

    // Verify Manager QR validity
    if (!broadcastQR || !broadcastQR.isActive || broadcastQR.generatedByRole !== 'manager') {
      return false;
    }

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const checkInTime = `${hours}:${minutes} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;
    const isLate = now.getHours() > 8 || (now.getHours() === 8 && now.getMinutes() > 30);

    const newAttendanceSession: AttendanceSession = {
      id: `att-${Date.now()}`,
      teacherId: currentUser.employeeId || currentUser.id,
      teacherName: currentUser.name,
      date: todayDateStr,
      checkInTime,
      checkInMethod: 'qr',
      status: isLate ? 'late' : 'present',
      qrStationId: 'station-main-entrance',
      note: 'Verified via Main Gate Entrance QR Terminal #1'
    };

    setAttendanceRecords(prev => [newAttendanceSession, ...prev]);
    return true;
  };

  // Academic Manager Manual Attendance Override
  const handleManualMarkTeacher = (teacherId: string, status: 'present' | 'late' | 'absent') => {
    if (currentUser?.role !== 'manager') return;

    const teacher = users.find(u => u.employeeId === teacherId || u.id === teacherId);
    if (!teacher) return;

    const existingIndex = attendanceRecords.findIndex(
      r => r.date === todayDateStr && (r.teacherId === teacher.employeeId || r.teacherName === teacher.name)
    );

    if (existingIndex >= 0) {
      const updated = [...attendanceRecords];
      updated[existingIndex] = {
        ...updated[existingIndex],
        status,
        checkInTime: status === 'absent' ? '' : updated[existingIndex].checkInTime || '08:15 AM',
        checkInMethod: 'manual',
        note: 'Updated by Academic Manager Manual Override'
      };
      setAttendanceRecords(updated);
    } else {
      const newRec: AttendanceSession = {
        id: `att-manual-${Date.now()}`,
        teacherId: teacher.employeeId || teacher.id,
        teacherName: teacher.name,
        date: todayDateStr,
        checkInTime: status === 'absent' ? '' : '08:15 AM',
        checkInMethod: 'manual',
        status,
        note: 'Marked by Academic Manager Manual Override'
      };
      setAttendanceRecords([newRec, ...attendanceRecords]);
    }
  };

  // Feedback Submission
  const handleSubmitFeedback = (fbData: Omit<ManagerFeedback, 'id' | 'createdAt' | 'status'>) => {
    const newFb: ManagerFeedback = {
      ...fbData,
      id: `fb-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    setFeedbacks(prev => [newFb, ...prev]);
  };

  const handleReplyFeedback = (id: string, response: string) => {
    setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, response, status: 'resolved' } : f));
  };

  const handleResolveFeedback = (id: string) => {
    setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, status: 'resolved' } : f));
  };

  // Password Reset Request flow
  const handleRequestPasswordReset = (
    reqOrTeacherId: PasswordResetRequest | string,
    email?: string,
    requestedNewPassword?: string
  ) => {
    let targetTeacherId = '';
    let targetEmail = '';
    let targetRequestedNewPassword: string | undefined = undefined;
    let targetReason: string | undefined = undefined;
    let targetName: string | undefined = undefined;
    let targetDept: string | undefined = undefined;

    if (typeof reqOrTeacherId === 'object' && reqOrTeacherId !== null) {
      const obj = reqOrTeacherId as PasswordResetRequest;
      targetTeacherId = typeof obj.teacherId === 'string' ? obj.teacherId : '';
      targetEmail = typeof obj.email === 'string' ? obj.email : '';
      targetRequestedNewPassword = typeof obj.requestedNewPassword === 'string' ? obj.requestedNewPassword : undefined;
      targetReason = typeof obj.reason === 'string' ? obj.reason : undefined;
      targetName = typeof obj.teacherName === 'string' ? obj.teacherName : undefined;
      targetDept = typeof obj.department === 'string' ? obj.department : undefined;
    } else {
      targetTeacherId = String(reqOrTeacherId || '');
      targetEmail = String(email || '');
      targetRequestedNewPassword = requestedNewPassword;
    }

    const teacher = users.find(u => 
      (targetTeacherId && u.employeeId.toLowerCase() === targetTeacherId.toLowerCase()) || 
      (targetEmail && u.email.toLowerCase() === targetEmail.toLowerCase())
    );

    const cleanTeacherId = teacher?.employeeId || targetTeacherId || 'TCH-FACULTY';
    const cleanTeacherName = teacher?.name || targetName || 'Faculty Member';
    const cleanEmail = teacher?.email || targetEmail || '';
    const cleanDept = teacher?.department || targetDept || 'Faculty';

    const newReq: PasswordResetRequest = {
      id: `reset-${Date.now()}`,
      teacherId: cleanTeacherId,
      teacherName: cleanTeacherName,
      email: cleanEmail,
      department: cleanDept,
      requestedAt: new Date().toISOString(),
      requestedNewPassword: targetRequestedNewPassword,
      reason: targetReason || 'Password reset requested via Portal',
      status: 'pending'
    };
    setPasswordResets(prev => [newReq, ...prev]);
  };

  const handleApprovePasswordReset = async (requestId: string, approvedPassword?: string, managerNotes?: string) => {
    const req = passwordResets.find(r => r.id === requestId);
    if (!req) return;

    const newPwd = approvedPassword || req.requestedNewPassword || 'faculty_pass2026';
    const newHash = await hashPassword(newPwd);

    setUsers(prev => prev.map(u => {
      if (u.employeeId === req.teacherId || u.email === req.email) {
        return { ...u, passwordHash: newHash };
      }
      return u;
    }));

    setPasswordResets(prev => prev.map(r => {
      if (r.id === requestId) {
        return {
          ...r,
          status: 'approved',
          approvedAt: new Date().toISOString(),
          managerNotes: managerNotes || `Approved by Academic Manager. New password set.`
        };
      }
      return r;
    }));
  };

  const handleRejectPasswordReset = (requestId: string, managerNotes?: string) => {
    setPasswordResets(prev => prev.map(r => {
      if (r.id === requestId) {
        return {
          ...r,
          status: 'rejected',
          managerNotes: managerNotes || 'Declined by Academic Manager.'
        };
      }
      return r;
    }));
  };

  // Sign Up / Add Teacher by Academic Manager
  const handleSignUpTeacher = (newTeacher: TeacherUser) => {
    setUsers(prev => [...prev, newTeacher]);
  };

  // Update Profile
  const handleUpdateProfile = (updated: Partial<TeacherUser>) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, ...updated };
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
  };

  // If user is not logged in, display LoginView
  if (!currentUser || activeTab === 'login') {
    return (
      <LoginView
        onLoginSuccess={handleLogin}
        teachers={users}
        users={users}
        schoolName={schoolName}
        passwordResets={passwordResets}
        onRequestPasswordReset={handleRequestPasswordReset}
        onSubmitPasswordReset={handleRequestPasswordReset}
        onSignUpTeacher={handleSignUpTeacher}
        onRegisterUser={handleSignUpTeacher}
      />
    );
  }

  const pendingFeedbackCount = feedbacks.filter(f => f.status === 'pending').length;
  const pendingPasswordResetCount = passwordResets.filter(r => r.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans text-slate-900">
      {/* Sidebar Navigation */}
      <Sidebar
        currentUser={currentUser}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onLogout={handleLogout}
        broadcastQR={broadcastQR}
        onOpenKiosk={() => setIsKioskOpen(true)}
        pendingFeedbackCount={pendingFeedbackCount}
        pendingPasswordResetCount={pendingPasswordResetCount}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        isStationLocked={isStationLocked}
        schoolName={schoolName}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenKiosk={() => setIsKioskOpen(true)}
          broadcastQR={broadcastQR}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          todayDateFormatted={todayDateFormatted}
          activeTab={activeTab}
          isStationLocked={isStationLocked}
          schoolName={schoolName}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* 1. Academic Manager Exclusive Views */}
          {activeTab === 'manager_dashboard' && currentUser.role === 'manager' && (
            <ManagerDashboardView
              currentUser={currentUser}
              teachers={users}
              attendanceRecords={attendanceRecords}
              departments={departments}
              feedbacks={feedbacks}
              announcements={announcements}
              passwordResets={passwordResets}
              onApprovePasswordReset={handleApprovePasswordReset}
              onRejectPasswordReset={handleRejectPasswordReset}
              broadcastQR={broadcastQR}
              onPostTodayQR={handlePostTodayQR}
              onRegenerateTodayQR={handleRegenerateTodayQR}
              onNavigateTab={setActiveTab}
              onOpenKiosk={() => setIsKioskOpen(true)}
              onManualMarkTeacher={handleManualMarkTeacher}
              todayDateStr={todayDateStr}
            />
          )}

          {activeTab === 'manager_attendance' && currentUser.role === 'manager' && (
            <ManagerAttendanceView
              teachers={users}
              attendanceRecords={attendanceRecords}
              onManualMark={handleManualMarkTeacher}
              onClearAttendance={() => {
                clearAllAttendanceRecords();
                setAttendanceRecords([]);
              }}
              broadcastQR={broadcastQR}
              onPostTodayQR={handlePostTodayQR}
              onRegenerateTodayQR={handleRegenerateTodayQR}
              onStopQR={handleStopQR}
              onOpenKiosk={() => setIsKioskOpen(true)}
              todayDateStr={todayDateStr}
            />
          )}

          {activeTab === 'manager_teachers' && currentUser.role === 'manager' && (
            <ManagerTeachersView
              teachers={users}
              departments={departments}
              onSaveTeachers={setUsers}
              passwordResets={passwordResets}
              onApprovePasswordReset={handleApprovePasswordReset}
              onRejectPasswordReset={handleRejectPasswordReset}
            />
          )}

          {activeTab === 'manager_departments' && currentUser.role === 'manager' && (
            <ManagerDepartmentsView
              departments={departments}
              onSaveDepartments={setDepartments}
            />
          )}

          {/* 2. QR Attendance Station Mentor View */}
          {activeTab === 'qr_station' && (
            <QRStationPortalView
              currentUser={currentUser}
              teachers={users}
              users={users}
              attendanceRecords={attendanceRecords}
              broadcastQR={broadcastQR}
              activeBroadcastQR={broadcastQR}
              onOpenKiosk={() => setIsKioskOpen(true)}
              onManualMarkTeacher={handleManualMarkTeacher}
              isLocked={isStationLocked}
              onToggleLock={() => setIsStationLocked(!isStationLocked)}
              todayDateFormatted={todayDateFormatted}
              todayDateStr={todayDateStr}
              onPostTodayQR={handlePostTodayQR}
              onRegenerateTodayQR={handleRegenerateTodayQR}
              onStopQR={handleStopQR}
              schoolName={schoolName}
              isAutoCreateQREnabled={isAutoCreateQREnabled}
              onToggleAutoCreateQR={(val) => {
                setIsAutoCreateQREnabled(val);
                storage.saveAutoCreateQREnabled(val);
              }}
            />
          )}

          {/* 3. Faculty Teacher Views */}
          {activeTab === 'dashboard' && (
            <DashboardView
              currentUser={currentUser}
              attendanceRecords={attendanceRecords.filter(r => r.teacherId === currentUser.employeeId || r.teacherName === currentUser.name)}
              broadcastQR={broadcastQR}
              onOpenScanner={() => setIsScannerOpen(true)}
              alreadyScannedToday={hasTeacherScannedToday}
              onNavigateTab={setActiveTab}
              onOpenFeedback={() => setIsFeedbackModalOpen(true)}
              todayDateFormatted={todayDateFormatted}
              todayDateStr={todayDateStr}
            />
          )}

          {activeTab === 'attendance' && (
            <AttendanceView
              currentUser={currentUser}
              attendanceRecords={attendanceRecords.filter(r => r.teacherId === currentUser.employeeId || r.teacherName === currentUser.name)}
              allAttendanceRecords={attendanceRecords}
              teachers={users}
              broadcastQR={broadcastQR}
              onOpenScanner={() => setIsScannerOpen(true)}
              alreadyScannedToday={hasTeacherScannedToday}
              todayDateStr={todayDateStr}
              onEraseAttendance={() => {
                clearAllAttendanceRecords();
                setAttendanceRecords([]);
              }}
            />
          )}

          {activeTab === 'classes' && (
            <ClassesView
              currentUser={currentUser}
              classes={classes}
              onSaveClasses={setClasses}
            />
          )}

          {activeTab === 'students' && (
            <StudentsView
              students={students}
              classes={classes}
              onSaveStudents={setStudents}
            />
          )}

          {activeTab === 'timetable' && (
            <TimetableScheduleView
              currentUser={currentUser}
              timetable={timetable}
              onSaveTimetable={setTimetable}
            />
          )}

          {activeTab === 'assignments' && (
            <AssignmentsView
              assignments={assignments}
              classes={classes}
              onSaveAssignments={setAssignments}
            />
          )}

          {activeTab === 'submissions' && (
            <SubmissionsView
              submissions={submissions}
              onGradeSubmission={(id, score, feedback) => {
                setSubmissions(prev => prev.map(s => s.id === id ? { ...s, score, feedback } : s));
              }}
            />
          )}

          {activeTab === 'grades' && (
            <GradesView
              students={students}
              classes={classes}
            />
          )}

          {activeTab === 'materials' && (
            <MaterialsView
              materials={materials}
              classes={classes}
              onSaveMaterials={setMaterials}
            />
          )}

          {/* 4. Common Views */}
          {activeTab === 'feedback_view' && (
            <FeedbackView
              feedbacks={feedbacks}
              onReplyFeedback={handleReplyFeedback}
              onResolveFeedback={handleResolveFeedback}
            />
          )}

          {activeTab === 'announcements' && (
            <AnnouncementsView
              currentUser={currentUser}
              announcements={announcements}
              onSaveAnnouncements={setAnnouncements}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              currentUser={currentUser}
              attendanceRecords={attendanceRecords}
              teachers={users}
              schoolName={schoolName}
              onClearAttendance={() => {
                clearAllAttendanceRecords();
                setAttendanceRecords([]);
              }}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              currentUser={currentUser}
              schoolName={schoolName}
              onChangeSchoolName={setSchoolName}
              onOpenKiosk={() => setIsKioskOpen(true)}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileView
              currentUser={currentUser}
              onUpdateProfile={handleUpdateProfile}
            />
          )}
        </main>
      </div>

      {/* Global Kiosk Screen Modal */}
      <SchoolEntranceKioskModal
        isOpen={isKioskOpen}
        onClose={() => setIsKioskOpen(false)}
        currentUser={currentUser}
        broadcastQR={broadcastQR}
        onPostTodayQR={handlePostTodayQR}
        onRegenerateTodayQR={handleRegenerateTodayQR}
        todayDateFormatted={todayDateFormatted}
        schoolName={schoolName}
      />

      {/* QR Camera Scanner Modal for Faculty Attendance */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanAttendance}
        alreadyScannedToday={hasTeacherScannedToday}
        todayDateFormatted={todayDateFormatted}
        activeBroadcastQR={broadcastQR}
      />

      {/* Feedback to Academic Manager Modal */}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        currentUser={currentUser}
        onSubmitFeedback={handleSubmitFeedback}
      />
    </div>
  );
}

export default App;
