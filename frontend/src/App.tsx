import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/login";
import Signup from "./pages/signUp"
import Profile from './pages/Profile';
import ChangePassword from './pages/ChangePassword';
import EditProfile from './pages/EditProfile';
import { ThemeProvider } from "./contexts/ThemeContext"; 
import Dashboard from "./pages/Module9_Dashboard/Dashboard";
import SpeakingSelection from './pages/Module1_Speaking/SpeakingSelection';
import SpeakingPractice from './pages/Module1_Speaking/SpeakingPractice';
import SpeakingFeedback from './pages/Module1_Speaking/SpeakingFeedback';

import ListeningHome     from "./pages/Module2_Listening/ListeningHome";
import ListeningSession  from "./pages/Module2_Listening/ListeningSession";
import ListeningResults  from "./pages/Module2_Listening/ListeningResults";
import ListeningProgress from "./pages/Module2_Listening/ListeningProgress";
import ReadingSelection from './pages/Module3_Reading/ReadingSelection';
import ReadingPractice from './pages/Module3_Reading/ReadingPractice';
import ReadingFeedback from './pages/Module3_Reading/ReadingFeedback';
import WritingSelection from './pages/Module4_Writing/WritingSelection';
import WritingPractice from './pages/Module4_Writing/WritingPractice';
import WritingFeedback from './pages/Module4_Writing/WritingFeedback';
import WritingHistory from './pages/Module4_Writing/WritingHistory';
import VocabBands from './pages/Module5_Vocabulary/VocabBands';
import VocabFlashcards from './pages/Module5_Vocabulary/VocabFlashcards';
import VocabQuiz from './pages/Module5_Vocabulary/VocabQuiz';
import VocabProgress from './pages/Module5_Vocabulary/VocabProgress';
import BaselineIntro from './pages/Module6_BaselineTest/BaselineIntro';
import BaselineTest from './pages/Module6_BaselineTest/BaselineTest';
import BaselineFeedback from './pages/Module6_BaselineTest/BaselineFeedback';
import MockSelection from './pages/Module7_MockTests/MockSelection';
import MockStart from './pages/Module7_MockTests/MockStart';
import MockResult from './pages/Module7_MockTests/MockResult';
import PlannerHome from './pages/Module8_StudyPlanner/PlannerHome';
import PlannerCalendar from './pages/Module8_StudyPlanner/PlannerCalendar';
import AdminDashboard from './pages/Module11_Admin/AdminDashboard';
import ChatScreen from './pages/Module12_LiveChat/ChatScreen';
import AdminRoute from './components/AdminRoute';
import BaselineRoute from './components/BaselineRoute';
import Help from './pages/Module9_Dashboard/HelpSupport';
import SetPassword  from "./pages/SetPassword";
import VerifyEmail  from "./pages/VerifyEmail";

const isAuthenticated = () => {
  return !!localStorage.getItem("token");
};

const ProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
};

// Route that requires both authentication and completed baseline test
const FullAccessRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <BaselineRoute>{children}</BaselineRoute>;
};

export default function App() {
  return (
     <ThemeProvider>
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />

      <Route path="/signup" element={<Signup />} />

      <Route 
          path="/profile" 
          element={
            <FullAccessRoute>
              <Profile />
            </FullAccessRoute>
          } 
        />               
      <Route path="/profile/edit" element={<FullAccessRoute><EditProfile /></FullAccessRoute>} />          
      <Route path="/setup-profile" element={<FullAccessRoute><EditProfile /></FullAccessRoute>} />   
      <Route path="/verify-email/:token" element={<VerifyEmail />} />
      <Route 
        path="/admin/dashboard" 
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } 
      />     
      <Route path="/help" element={<FullAccessRoute><Help /></FullAccessRoute>} />
      <Route
        path="/dashboard"
        element={
          <FullAccessRoute>
            <Dashboard />
          </FullAccessRoute>
        }
      />
          <Route 
      path="/change-password" 
      element={
        <FullAccessRoute>
          <ChangePassword />
        </FullAccessRoute>
      } 
/>
      <Route path="/speaking" element={<FullAccessRoute><SpeakingSelection /></FullAccessRoute>} />
      <Route path="/speaking/practice" element={<FullAccessRoute><SpeakingPractice /></FullAccessRoute>} />
      <Route path="/speaking/feedback" element={<FullAccessRoute><SpeakingFeedback /></FullAccessRoute>} />
      
      <Route path="/listening"                     element={<ListeningHome />} />
      <Route path="/listening/session/:sessionId"  element={<ListeningSession />} />
      <Route path="/listening/mock/:sessionId"     element={<ListeningSession />} />
      <Route path="/listening/results/:sessionId"  element={<ListeningResults />} />
      <Route path="/listening/progress"            element={<ListeningProgress />} />
      <Route path="/reading" element={<FullAccessRoute><ReadingSelection /></FullAccessRoute>} />
      <Route path="/reading/practice" element={<FullAccessRoute><ReadingPractice /></FullAccessRoute>} />
      <Route path="/reading/feedback" element={<FullAccessRoute><ReadingFeedback /></FullAccessRoute>} />
      <Route path="/writing" element={<FullAccessRoute><WritingSelection /></FullAccessRoute>} />
      <Route path="/writing/practice" element={<FullAccessRoute><WritingPractice /></FullAccessRoute>} />
      <Route path="/writing/feedback" element={<FullAccessRoute><WritingFeedback /></FullAccessRoute>} />
      <Route path="/writing/feedback/:sessionId" element={<FullAccessRoute><WritingFeedback /></FullAccessRoute>} />
      <Route path="/writing/history" element={<FullAccessRoute><WritingHistory /></FullAccessRoute>} />
      <Route path="/vocabulary" element={<FullAccessRoute><VocabBands /></FullAccessRoute>} />
      <Route path="/vocabulary/flashcards" element={<FullAccessRoute><VocabFlashcards /></FullAccessRoute>} />
      <Route path="/vocabulary/quiz" element={<FullAccessRoute><VocabQuiz /></FullAccessRoute>} />
      <Route path="/vocabulary/progress" element={<FullAccessRoute><VocabProgress /></FullAccessRoute>} />
      <Route path="/baseline-test" element={<ProtectedRoute><BaselineIntro /></ProtectedRoute>} />
      <Route path="/baseline-test/start" element={<ProtectedRoute><BaselineTest /></ProtectedRoute>} />
      <Route path="/baseline-test/result" element={<ProtectedRoute><BaselineFeedback /></ProtectedRoute>} />
      <Route path="/mock-tests" element={<FullAccessRoute><MockSelection /></FullAccessRoute>} />
      <Route path="/mock-tests/start" element={<FullAccessRoute><MockStart /></FullAccessRoute>} />
      <Route path="/mock-tests/result" element={<FullAccessRoute><MockResult /></FullAccessRoute>} />
      <Route path="/study-planner" element={<FullAccessRoute><PlannerHome /></FullAccessRoute>} />
      <Route path="/study-planner/calendar" element={<FullAccessRoute><PlannerCalendar /></FullAccessRoute>} />
      <Route path="/admin" element={<FullAccessRoute><AdminDashboard /></FullAccessRoute>} />
      <Route path="/chat" element={<FullAccessRoute><ChatScreen /></FullAccessRoute>} />
      <Route path="/set-password" element={<SetPassword />} />
      </Routes>
      </ThemeProvider>
        );
      }