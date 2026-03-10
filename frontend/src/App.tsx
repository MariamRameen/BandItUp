import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/login";
import Signup from "./pages/signUp"
import Profile from './pages/Profile';
import ListeningHistory from "./pages/Module2_Listening/ListeningHistory";
import SpeakingHome      from "./pages/Module_Speaking/SpeakingHome";
import SpeakingSession   from "./pages/Module_Speaking/SpeakingSession";
import SpeakingIELTS     from "./pages/Module_Speaking/SpeakingIELTS";
import SpeakingWeeklyMock from "./pages/Module_Speaking/SpeakingWeeklyMock";
import SpeakingHistory   from "./pages/Module_Speaking/SpeakingHistory";
import SpeakingProgress  from "./pages/Module_Speaking/SpeakingProgress";
import ChangePassword from './pages/ChangePassword';
import EditProfile from './pages/EditProfile';
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Module9_Dashboard/Dashboard";
import ListeningHome     from "./pages/Module2_Listening/ListeningHome";
import ListeningSession  from "./pages/Module2_Listening/ListeningSession";
import ListeningResults  from "./pages/Module2_Listening/ListeningResults";
import ListeningProgress from "./pages/Module2_Listening/ListeningProgress";
import ReadingSelection from './pages/Module3_Reading/ReadingSelection';
import ReadingPractice from './pages/Module3_Reading/ReadingPractice';
import ReadingFeedback from './pages/Module3_Reading/ReadingFeedback';
import ReadingHistory from './pages/Module3_Reading/ReadingHistory';
import WritingSelection from './pages/Module4_Writing/WritingSelection';
import WritingPractice from './pages/Module4_Writing/WritingPractice';
import WritingFeedback from './pages/Module4_Writing/WritingFeedback';
import WritingHistory from './pages/Module4_Writing/WritingHistory';
import VocabBands from './pages/Module5_Vocabulary/VocabBands';
import VocabFlashcards from './pages/Module5_Vocabulary/VocabFlashcards';
import VocabQuiz from './pages/Module5_Vocabulary/VocabQuiz';
import VocabProgress from './pages/Module5_Vocabulary/VocabProgress';
import BaselineGate from './pages/Module6_BaselineTest/BaselineGate';
import BaselineTest from './pages/Module6_BaselineTest/BaselineTest';
import BaselineGuard from "./components/BaselineGuard";
import BaselineResults from './pages/Module6_BaselineTest/BaselineResults';
import MockSelection from './pages/Module7_MockTests/MockSelection';
import MockTestTaking from './pages/Module7_MockTests/MockTestTaking';
import MockResult from './pages/Module7_MockTests/MockResult';
import PlannerHome from './pages/Module8_StudyPlanner/PlannerHome';
import PlannerCalendar from './pages/Module8_StudyPlanner/PlannerCalendar';
import PlannerRoadmap from './pages/Module8_StudyPlanner/PlannerRoadmap';
import PlannerAchievements from './pages/Module8_StudyPlanner/PlannerAchievements';
import NotificationSettings from './pages/Module8_StudyPlanner/NotificationSettings';
import ProgressHistory from './pages/Module8_StudyPlanner/ProgressHistory';
import WelcomeBack from './components/WelcomeBack';
import AdminDashboard from './pages/Module11_Admin/AdminDashboard';
import ChatScreen from './pages/Module12_LiveChat/ChatScreen';
import AdminRoute from './components/AdminRoute';
import Help from './pages/Module9_Dashboard/HelpSupport';
import SetPassword  from "./pages/SetPassword";
import VerifyEmail  from "./pages/VerifyEmail";

const isAuthenticated = () => !!localStorage.getItem("token");

const ProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
};

const FullAccessRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return children;
};

export default function App() {
  return (
    <ThemeProvider>
      <BaselineGuard>
        <WelcomeBack />
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile" element={<FullAccessRoute><Profile /></FullAccessRoute>} />
          <Route path="/profile/edit" element={<FullAccessRoute><EditProfile /></FullAccessRoute>} />
          <Route path="/setup-profile" element={<FullAccessRoute><EditProfile /></FullAccessRoute>} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/help" element={<FullAccessRoute><Help /></FullAccessRoute>} />
          <Route path="/dashboard" element={<FullAccessRoute><Dashboard /></FullAccessRoute>} />
          <Route path="/change-password" element={<FullAccessRoute><ChangePassword /></FullAccessRoute>} />

          {/* Listening */}
          <Route path="/listening"                    element={<ListeningHome />} />
          <Route path="/listening/session/:sessionId" element={<ListeningSession />} />
          <Route path="/listening/mock/:sessionId"    element={<ListeningSession />} />
          <Route path="/listening/results/:sessionId" element={<ListeningResults />} />
          <Route path="/listening/progress"           element={<ListeningProgress />} />
          <Route path="/listening/history"            element={<ListeningHistory />} />

          {/* Speaking */}
          <Route path="/speaking"             element={<FullAccessRoute><SpeakingHome /></FullAccessRoute>} />
          <Route path="/speaking/session"     element={<FullAccessRoute><SpeakingSession /></FullAccessRoute>} />
          <Route path="/speaking/ielts"       element={<FullAccessRoute><SpeakingIELTS /></FullAccessRoute>} />
          <Route path="/speaking/weekly-mock" element={<FullAccessRoute><SpeakingWeeklyMock /></FullAccessRoute>} />
          <Route path="/speaking/history"     element={<FullAccessRoute><SpeakingHistory /></FullAccessRoute>} />
          <Route path="/speaking/progress"    element={<FullAccessRoute><SpeakingProgress /></FullAccessRoute>} />

          {/* Reading */}
          <Route path="/reading"          element={<FullAccessRoute><ReadingSelection /></FullAccessRoute>} />
          <Route path="/reading/practice" element={<FullAccessRoute><ReadingPractice /></FullAccessRoute>} />
          <Route path="/reading/feedback" element={<FullAccessRoute><ReadingFeedback /></FullAccessRoute>} />
          <Route path="/reading/history"  element={<FullAccessRoute><ReadingHistory /></FullAccessRoute>} />

          {/* Writing */}
          <Route path="/writing"                     element={<FullAccessRoute><WritingSelection /></FullAccessRoute>} />
          <Route path="/writing/practice"            element={<FullAccessRoute><WritingPractice /></FullAccessRoute>} />
          <Route path="/writing/feedback"            element={<FullAccessRoute><WritingFeedback /></FullAccessRoute>} />
          <Route path="/writing/feedback/:sessionId" element={<FullAccessRoute><WritingFeedback /></FullAccessRoute>} />
          <Route path="/writing/history"             element={<FullAccessRoute><WritingHistory /></FullAccessRoute>} />

          {/* Vocabulary */}
          <Route path="/vocabulary"            element={<FullAccessRoute><VocabBands /></FullAccessRoute>} />
          <Route path="/vocabulary/flashcards" element={<FullAccessRoute><VocabFlashcards /></FullAccessRoute>} />
          <Route path="/vocabulary/quiz"       element={<FullAccessRoute><VocabQuiz /></FullAccessRoute>} />
          <Route path="/vocabulary/progress"   element={<FullAccessRoute><VocabProgress /></FullAccessRoute>} />

          {/* Baseline */}
          <Route path="/baseline"         element={<BaselineGate />} />
          <Route path="/baseline/test"    element={<BaselineTest />} />
          <Route path="/baseline/results" element={<BaselineResults />} />

          {/* Mock Tests */}
          <Route path="/mock-tests"        element={<FullAccessRoute><MockSelection /></FullAccessRoute>} />
          <Route path="/mock-tests/start"  element={<FullAccessRoute><MockTestTaking /></FullAccessRoute>} />
          <Route path="/mock-tests/result" element={<FullAccessRoute><MockResult /></FullAccessRoute>} />

          {/* Study Planner */}
          <Route path="/study-planner"              element={<FullAccessRoute><PlannerHome /></FullAccessRoute>} />
          <Route path="/study-planner/calendar"     element={<FullAccessRoute><PlannerCalendar /></FullAccessRoute>} />
          <Route path="/study-planner/roadmap"      element={<FullAccessRoute><PlannerRoadmap /></FullAccessRoute>} />
          <Route path="/study-planner/achievements" element={<FullAccessRoute><PlannerAchievements /></FullAccessRoute>} />
          <Route path="/study-planner/progress"     element={<FullAccessRoute><ProgressHistory /></FullAccessRoute>} />
          <Route path="/settings/notifications"     element={<FullAccessRoute><NotificationSettings /></FullAccessRoute>} />

          {/* Admin & Chat */}
          <Route path="/admin" element={<FullAccessRoute><AdminDashboard /></FullAccessRoute>} />
          <Route path="/chat"  element={<FullAccessRoute><ChatScreen /></FullAccessRoute>} />

          <Route path="/set-password" element={<SetPassword />} />
        </Routes>
      </BaselineGuard>
    </ThemeProvider>
  );
}
