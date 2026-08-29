import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Context
import { AuthProvider } from './context/AuthContext.jsx';

// Layout
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Pages
import Login       from './pages/Login.jsx';
import Register    from './pages/Register.jsx';
import Profile     from './pages/Profile.jsx';
import Unauthorized from './pages/Unauthorized.jsx';

// Dashboards
import AdminDashboard    from './pages/admin/Dashboard.jsx';
import MentorDashboard   from './pages/mentor/Dashboard.jsx';
import AspirantDashboard from './pages/aspirant/Dashboard.jsx';

// Exam & Syllabus pages
import ExamsList         from './pages/exams/ExamsList.jsx';
import ExamDetails        from './pages/exams/ExamDetails.jsx';
import ExamSyllabus      from './pages/exams/ExamSyllabus.jsx';
import AdminExams        from './pages/admin/AdminExams.jsx';
import AdminSyllabus     from './pages/admin/AdminSyllabus.jsx';
import AspirantSyllabus  from './pages/aspirant/AspirantSyllabus.jsx';
import MentorSyllabus    from './pages/mentor/MentorSyllabus.jsx';
import SyllabusManagement from './pages/admin/SyllabusManagement.jsx';
import SyllabusTreeView   from './pages/admin/SyllabusTreeView.jsx';

// Questions & Practice pages
import AdminQuestions     from './pages/admin/AdminQuestions.jsx';
import QuestionLibrary    from './pages/admin/QuestionLibrary.jsx';
import MentorQuestions    from './pages/mentor/MentorQuestions.jsx';
import CreateQuestion     from './pages/mentor/CreateQuestion.jsx';
import Practice           from './pages/aspirant/Practice.jsx';
import PreviousYearQuestions from './pages/aspirant/PreviousYearQuestions.jsx';
import BookmarkedQuestions from './pages/aspirant/BookmarkedQuestions.jsx';

// Mock Test Engine pages
import MockTestsList       from './pages/aspirant/MockTestsList.jsx';
import TestInstructions   from './pages/aspirant/TestInstructions.jsx';
import TestAttempt        from './pages/aspirant/TestAttempt.jsx';
import TestResult         from './pages/aspirant/TestResult.jsx';
import CustomPractice     from './pages/aspirant/CustomPractice.jsx';
import AdminMockTests     from './pages/admin/AdminMockTests.jsx';
import MentorMockTests    from './pages/mentor/MentorMockTests.jsx';

// Step 4 Mock Test Pages
import MockTestManagement from './pages/admin/MockTestManagement.jsx';
import MockTestEditor     from './pages/admin/MockTestEditor.jsx';
import MockTestAnalytics  from './pages/admin/MockTestAnalytics.jsx';
import MockTests          from './pages/aspirant/MockTests.jsx';
import MockTestDetails    from './pages/aspirant/MockTestDetails.jsx';
import MockTestAttempt    from './pages/aspirant/MockTestAttempt.jsx';
import MockTestResult     from './pages/aspirant/MockTestResult.jsx';
import MockTestHistory    from './pages/aspirant/MockTestHistory.jsx';

// Step 5.1 PYQ Paper Simulator pages
import PYQPaperManagement from './pages/admin/PYQPaperManagement.jsx';
import PYQPaperEditor     from './pages/admin/PYQPaperEditor.jsx';
import PYQPaperAnalytics  from './pages/admin/PYQPaperAnalytics.jsx';
import PYQPapers          from './pages/aspirant/PYQPapers.jsx';
import PYQPaperDetails    from './pages/aspirant/PYQPaperDetails.jsx';
import PYQPaperAttempt    from './pages/aspirant/PYQPaperAttempt.jsx';
import PYQPaperResult     from './pages/aspirant/PYQPaperResult.jsx';
import PYQComparison      from './pages/aspirant/PYQComparison.jsx';
import PYQAttemptHistory  from './pages/aspirant/PYQAttemptHistory.jsx';

// Step 5.2 Current Affairs pages
import CurrentAffairsManagement from './pages/admin/CurrentAffairsManagement.jsx';
import CurrentAffairsSourceEditor from './pages/admin/CurrentAffairsSourceEditor.jsx';
import CurrentAffairsPackEditor   from './pages/admin/CurrentAffairsPackEditor.jsx';
import CurrentAffairsPackAnalytics from './pages/admin/CurrentAffairsPackAnalytics.jsx';
import CurrentAffairs             from './pages/aspirant/CurrentAffairs.jsx';
import CurrentAffairsPackDetails  from './pages/aspirant/CurrentAffairsPackDetails.jsx';
import CurrentAffairsHistory      from './pages/aspirant/CurrentAffairsHistory.jsx';


// Content Command, Practice, Spaced Repetition, and Mistakes Notebook pages
import ContentCommandCenter from './pages/admin/ContentCommandCenter.jsx';
import BulkImport           from './pages/admin/BulkImport.jsx';
import QuestionReview       from './pages/admin/QuestionReview.jsx';
import ContentCoverage      from './pages/admin/ContentCoverage.jsx';
import QuestionImportDashboard from './pages/admin/QuestionImportDashboard.jsx';
import QuestionQualityDashboard from './pages/admin/QuestionQualityDashboard.jsx';
import QuestionGenerator    from './pages/mentor/QuestionGenerator.jsx';
import SmartPractice        from './pages/aspirant/SmartPractice.jsx';
import TopicPractice        from './pages/aspirant/TopicPractice.jsx';
import PracticeSession      from './pages/aspirant/PracticeSession.jsx';
import PracticeResult      from './pages/aspirant/PracticeResult.jsx';
import PracticeHistory      from './pages/aspirant/PracticeHistory.jsx';
import RevisionDashboard    from './pages/aspirant/RevisionDashboard.jsx';
import ReviseToday          from './pages/aspirant/ReviseToday.jsx';
import MistakeNotebook      from './pages/aspirant/MistakeNotebook.jsx';
import RevisionQuestion     from './pages/aspirant/RevisionQuestion.jsx';
import WeakTopics           from './pages/aspirant/WeakTopics.jsx';
import ContentHealth        from './pages/admin/ContentHealth.jsx';
import ContentAnalytics     from './pages/admin/ContentAnalytics.jsx';
import ContentRecommendations from './pages/aspirant/ContentRecommendations.jsx';
import PreviousYearPapers   from './pages/aspirant/PreviousYearPapers.jsx';
import PaperAttemptHistory  from './pages/aspirant/PaperAttemptHistory.jsx';
import PreviousYearPaperAttempt from './pages/aspirant/PreviousYearPaperAttempt.jsx';
import PreviousYearPaperResult from './pages/aspirant/PreviousYearPaperResult.jsx';
import AnswerWritingLibrary from './pages/aspirant/AnswerWritingLibrary.jsx';
import AnswerWritingEditor  from './pages/aspirant/AnswerWritingEditor.jsx';
import AnswerWritingHistory from './pages/aspirant/AnswerWritingHistory.jsx';
import AnswerSubmissionDetail from './pages/aspirant/AnswerSubmissionDetail.jsx';
import AnswerWritingAnalytics  from './pages/aspirant/AnswerWritingAnalytics.jsx';

// Tutorial learning pages
import TutorialManagement from './pages/admin/TutorialManagement.jsx';
import TutorialEditor from './pages/admin/TutorialEditor.jsx';
import Tutorials from './pages/aspirant/Tutorials.jsx';
import TutorialDetails from './pages/aspirant/TutorialDetails.jsx';
import MyLearning from './pages/aspirant/MyLearning.jsx';

// Fallbacks and core templates
import ErrorBoundary from './components/common/ErrorBoundary.jsx';
import NotFound from './pages/NotFound.jsx';

// Home — inline lightweight version
import Home from './pages/Home.jsx';

export default function App() {
  return (
    <AuthProvider>
      {/* Global Toast Provider */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#f8fafc',
            border: '1px solid #334155',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#6366f1', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#f43f5e', secondary: '#fff' } },
        }}
      />

      {/* Sticky Navbar (shown on all pages) */}
      <Navbar />
      
      <ErrorBoundary>
        <Routes>
        {/* Public routes */}
        <Route path="/"            element={<Home />} />
        <Route path="/login"       element={<Login />} />
        <Route path="/register"    element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Public exam routes */}
        <Route path="/exams"              element={<ExamsList />} />
        <Route path="/exams/:id"          element={<ExamDetails />} />
        <Route path="/exams/:id/syllabus" element={<ExamSyllabus />} />

        {/* Protected: any authenticated user */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Protected: Admin only */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/exams"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminExams />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/exams/:examId/syllabus"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminSyllabus />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/syllabus"
          element={
            <ProtectedRoute roles={['admin']}>
              <SyllabusManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/syllabus/tree"
          element={
            <ProtectedRoute roles={['admin']}>
              <SyllabusTreeView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/questions"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminQuestions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/question-library"
          element={
            <ProtectedRoute roles={['admin']}>
              <QuestionLibrary />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/mock-tests"
          element={
            <ProtectedRoute roles={['admin']}>
              <MockTestManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/mock-tests/create"
          element={
            <ProtectedRoute roles={['admin']}>
              <MockTestEditor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/mock-tests/:id/edit"
          element={
            <ProtectedRoute roles={['admin']}>
              <MockTestEditor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/mock-tests/:id/analytics"
          element={
            <ProtectedRoute roles={['admin']}>
              <MockTestAnalytics />
            </ProtectedRoute>
          }
        />
        {/* Admin PYQ Paper routes */}
        <Route
          path="/admin/pyq-papers"
          element={
            <ProtectedRoute roles={['admin']}>
              <PYQPaperManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/pyq-papers/create"
          element={
            <ProtectedRoute roles={['admin']}>
              <PYQPaperEditor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/pyq-papers/:id/edit"
          element={
            <ProtectedRoute roles={['admin']}>
              <PYQPaperEditor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/pyq-papers/:id/analytics"
          element={
            <ProtectedRoute roles={['admin']}>
              <PYQPaperAnalytics />
            </ProtectedRoute>
          }
        />
        {/* Admin Current Affairs Routes */}
        <Route
          path="/admin/current-affairs"
          element={
            <ProtectedRoute roles={['admin']}>
              <CurrentAffairsManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/current-affairs/sources/create"
          element={
            <ProtectedRoute roles={['admin']}>
              <CurrentAffairsSourceEditor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/current-affairs/sources/:id/edit"
          element={
            <ProtectedRoute roles={['admin']}>
              <CurrentAffairsSourceEditor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/current-affairs/packs/create"
          element={
            <ProtectedRoute roles={['admin']}>
              <CurrentAffairsPackEditor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/current-affairs/packs/:id/edit"
          element={
            <ProtectedRoute roles={['admin']}>
              <CurrentAffairsPackEditor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/current-affairs/packs/:id/analytics"
          element={
            <ProtectedRoute roles={['admin']}>
              <CurrentAffairsPackAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/content-command-center"
          element={
            <ProtectedRoute roles={['admin']}>
              <ContentCommandCenter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/bulk-import"
          element={
            <ProtectedRoute roles={['admin']}>
              <BulkImport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/question-import"
          element={
            <ProtectedRoute roles={['admin']}>
              <QuestionImportDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/question-review"
          element={
            <ProtectedRoute roles={['admin']}>
              <QuestionReview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/question-quality"
          element={
            <ProtectedRoute roles={['admin']}>
              <QuestionQualityDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/content-coverage"
          element={
            <ProtectedRoute roles={['admin']}>
              <ContentCoverage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/content-health"
          element={
            <ProtectedRoute roles={['admin']}>
              <ContentHealth />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/content-analytics"
          element={
            <ProtectedRoute roles={['admin']}>
              <ContentAnalytics />
            </ProtectedRoute>
          }
        />

        {/* Admin Tutorials */}
        <Route
          path="/admin/tutorials"
          element={
            <ProtectedRoute roles={['admin']}>
              <TutorialManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tutorials/create"
          element={
            <ProtectedRoute roles={['admin']}>
              <TutorialEditor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tutorials/:id/edit"
          element={
            <ProtectedRoute roles={['admin']}>
              <TutorialEditor />
            </ProtectedRoute>
          }
        />

        {/* Protected: Mentor only */}
        <Route
          path="/mentor/dashboard"
          element={
            <ProtectedRoute roles={['mentor']}>
              <MentorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mentor/syllabus"
          element={
            <ProtectedRoute roles={['mentor']}>
              <MentorSyllabus />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mentor/questions"
          element={
            <ProtectedRoute roles={['mentor']}>
              <MentorQuestions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mentor/questions/create"
          element={
            <ProtectedRoute roles={['mentor']}>
              <CreateQuestion />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mentor/mock-tests"
          element={
            <ProtectedRoute roles={['mentor']}>
              <MentorMockTests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mentor/question-generator"
          element={
            <ProtectedRoute roles={['mentor', 'admin']}>
              <QuestionGenerator />
            </ProtectedRoute>
          }
        />

        {/* Protected: Aspirant only */}
        <Route
          path="/aspirant/dashboard"
          element={
            <ProtectedRoute roles={['aspirant']}>
              <AspirantDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aspirant/syllabus"
          element={
            <ProtectedRoute roles={['aspirant']}>
              <AspirantSyllabus />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aspirant/recommendations"
          element={
            <ProtectedRoute roles={['aspirant']}>
              <ContentRecommendations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aspirant/practice"
          element={
            <ProtectedRoute roles={['aspirant']}>
              <Practice />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aspirant/previous-year-questions"
          element={
            <ProtectedRoute roles={['aspirant']}>
              <PreviousYearQuestions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aspirant/bookmarks"
          element={
            <ProtectedRoute roles={['aspirant']}>
              <BookmarkedQuestions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aspirant/mock-tests"
          element={
            <ProtectedRoute roles={['aspirant']}>
              <MockTests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aspirant/mock-tests/:id"
          element={
            <ProtectedRoute roles={['aspirant']}>
              <MockTestDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aspirant/mock-tests/attempt/:attemptId"
          element={
            <ProtectedRoute roles={['aspirant']}>
              <MockTestAttempt />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aspirant/mock-tests/attempt/:attemptId/result"
          element={
            <ProtectedRoute roles={['aspirant']}>
              <MockTestResult />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aspirant/mock-test-history"
          element={
            <ProtectedRoute roles={['aspirant']}>
              <MockTestHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aspirant/mock-tests/:id/instructions"
          element={
            <ProtectedRoute roles={['aspirant']}>
              <TestInstructions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aspirant/mock-tests/:id/attempt"
          element={
            <ProtectedRoute roles={['aspirant']}>
              <TestAttempt />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aspirant/mock-tests/:id/result"
          element={
            <ProtectedRoute roles={['aspirant']}>
              <TestResult />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aspirant/custom-practice"
          element={
            <ProtectedRoute roles={['aspirant']}>
              <CustomPractice />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aspirant/smart-practice"
          element={
            <ProtectedRoute roles={['aspirant']}>
              <SmartPractice />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aspirant/topic-practice"
          element={
            <ProtectedRoute roles={['aspirant']}>
              <TopicPractice />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aspirant/practice-history"
          element={
            <ProtectedRoute roles={['aspirant']}>
              <PracticeHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aspirant/practice-session/:sessionId"
          element={
            <ProtectedRoute roles={['aspirant']}>
              <PracticeSession />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aspirant/practice-session/:sessionId/result"
          element={
            <ProtectedRoute roles={['aspirant']}>
              <PracticeResult />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aspirant/revision"
          element={
            <ProtectedRoute roles={['aspirant']}>
              <RevisionDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aspirant/revise-today"
          element={
            <ProtectedRoute roles={['aspirant']}>
              <ReviseToday />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aspirant/revision/question/:revisionItemId"
          element={
            <ProtectedRoute roles={['aspirant']}>
              <RevisionQuestion />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aspirant/mistake-notebook"
          element={
            <ProtectedRoute roles={['aspirant']}>
              <MistakeNotebook />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aspirant/weak-topics"
          element={
            <ProtectedRoute roles={['aspirant']}>
              <WeakTopics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aspirant/previous-year-papers"
          element={
            <ProtectedRoute roles={['aspirant']}>
              <PreviousYearPapers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aspirant/paper-attempt-history"
          element={
            <ProtectedRoute roles={['aspirant']}>
              <PaperAttemptHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aspirant/previous-year-papers/attempt/:attemptId"
          element={
            <ProtectedRoute roles={['aspirant']}>
              <PreviousYearPaperAttempt />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aspirant/previous-year-papers/attempt/:attemptId/result"
          element={
            <ProtectedRoute roles={['aspirant']}>
              <PreviousYearPaperResult />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aspirant/answer-writing"
          element={
            <ProtectedRoute roles={['aspirant']}>
              <AnswerWritingLibrary />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aspirant/answer-writing/question/:questionId"
          element={
            <ProtectedRoute roles={['aspirant']}>
              <AnswerWritingEditor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aspirant/answer-writing/history"
          element={
            <ProtectedRoute roles={['aspirant']}>
              <AnswerWritingHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aspirant/answer-writing/submissions/:submissionId"
          element={
            <ProtectedRoute roles={['aspirant']}>
              <AnswerSubmissionDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aspirant/answer-writing/analytics"
          element={
            <ProtectedRoute roles={['aspirant']}>
              <AnswerWritingAnalytics />
            </ProtectedRoute>
          }
        />

        {/* Aspirant PYQ Paper Simulator routes */}
        <Route
          path="/aspirant/pyq-papers"
          element={
            <ProtectedRoute roles={['aspirant']}>
              <PYQPapers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aspirant/pyq-papers/:id"
          element={
            <ProtectedRoute roles={['aspirant']}>
              <PYQPaperDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aspirant/pyq-papers/attempt/:attemptId"
          element={
            <ProtectedRoute roles={['aspirant']}>
              <PYQPaperAttempt />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aspirant/pyq-papers/attempt/:attemptId/result"
          element={
            <ProtectedRoute roles={['aspirant']}>
              <PYQPaperResult />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aspirant/pyq-comparison"
          element={
            <ProtectedRoute roles={['aspirant']}>
              <PYQComparison />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aspirant/pyq-attempt-history"
          element={
            <ProtectedRoute roles={['aspirant']}>
              <PYQAttemptHistory />
            </ProtectedRoute>
          }
        />
        {/* Aspirant Current Affairs Routes */}
        <Route
          path="/aspirant/current-affairs"
          element={
            <ProtectedRoute roles={['aspirant']}>
              <CurrentAffairs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aspirant/current-affairs/:id"
          element={
            <ProtectedRoute roles={['aspirant']}>
              <CurrentAffairsPackDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aspirant/current-affairs-history"
          element={
            <ProtectedRoute roles={['aspirant']}>
              <CurrentAffairsHistory />
            </ProtectedRoute>
          }
        />

        {/* Aspirant Tutorials */}
        <Route
          path="/aspirant/tutorials"
          element={
            <ProtectedRoute roles={['aspirant']}>
              <Tutorials />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aspirant/tutorials/:id"
          element={
            <ProtectedRoute roles={['aspirant']}>
              <TutorialDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aspirant/my-learning"
          element={
            <ProtectedRoute roles={['aspirant']}>
              <MyLearning />
            </ProtectedRoute>
          }
        />

        {/* Catch-all → Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ErrorBoundary>
  </AuthProvider>
  );
}
