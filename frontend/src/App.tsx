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
import ListeningSelection from './pages/Module2_Listening/ListeningSelection';
import ListeningPractice from './pages/Module2_Listening/ListeningPractice';
import ListeningFeedback from './pages/Module2_Listening/ListeningFeedback';
import ReadingSelection from './pages/Module3_Reading/ReadingSelection';
import ReadingPractice from './pages/Module3_Reading/ReadingPractice';
import ReadingFeedback from './pages/Module3_Reading/ReadingFeedback';
import WritingSelection from './pages/Module4_Writing/WritingSelection';
import WritingPractice from './pages/Module4_Writing/WritingPractice';
import WritingFeedback from './pages/Module4_Writing/WritingFeedback';
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
import Help from './pages/Module9_Dashboard/HelpSupport';
import SetPassword  from "./pages/SetPassword";
import VerifyEmail  from "./pages/VerifyEmail";

const isAuthenticated = () => {
  return !!localStorage.getItem("token");
};

const ProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
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
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />               
      <Route path="/profile/edit" element={<EditProfile />} />          
      <Route path="/setup-profile" element={<EditProfile />} />   
      <Route path="/verify-email/:token" element={<VerifyEmail />} />
      <Route 
        path="/admin/dashboard" 
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } 
      />     
      <Route path="/help" element={<Help />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
          <Route 
      path="/change-password" 
      element={
        <ProtectedRoute>
          <ChangePassword />
        </ProtectedRoute>
      } 
/>
      <Route path="/speaking" element={<ProtectedRoute><SpeakingSelection /></ProtectedRoute>} />
      <Route path="/speaking/practice" element={<ProtectedRoute><SpeakingPractice /></ProtectedRoute>} />
      <Route path="/speaking/feedback" element={<ProtectedRoute><SpeakingFeedback /></ProtectedRoute>} />
      <Route path="/listening" element={<ProtectedRoute><ListeningSelection /></ProtectedRoute>} />
      <Route path="/listening/practice" element={<ProtectedRoute><ListeningPractice /></ProtectedRoute>} />
      <Route path="/listening/feedback" element={<ProtectedRoute><ListeningFeedback /></ProtectedRoute>} />
      <Route path="/reading" element={<ProtectedRoute><ReadingSelection /></ProtectedRoute>} />
      <Route path="/reading/practice" element={<ProtectedRoute><ReadingPractice /></ProtectedRoute>} />
      <Route path="/reading/feedback" element={<ProtectedRoute><ReadingFeedback /></ProtectedRoute>} />
      <Route path="/writing" element={<ProtectedRoute><WritingSelection /></ProtectedRoute>} />
      <Route path="/writing/practice" element={<ProtectedRoute><WritingPractice /></ProtectedRoute>} />
      <Route path="/writing/feedback" element={<ProtectedRoute><WritingFeedback /></ProtectedRoute>} />
      <Route path="/vocabulary" element={<ProtectedRoute><VocabBands /></ProtectedRoute>} />
      <Route path="/vocabulary/flashcards" element={<ProtectedRoute><VocabFlashcards /></ProtectedRoute>} />
      <Route path="/vocabulary/quiz" element={<ProtectedRoute><VocabQuiz /></ProtectedRoute>} />
      <Route path="/vocabulary/progress" element={<ProtectedRoute><VocabProgress /></ProtectedRoute>} />
      <Route path="/baseline-test" element={<ProtectedRoute><BaselineIntro /></ProtectedRoute>} />
      <Route path="/baseline-test/start" element={<ProtectedRoute><BaselineTest /></ProtectedRoute>} />
      <Route path="/baseline-test/result" element={<ProtectedRoute><BaselineFeedback /></ProtectedRoute>} />
      <Route path="/mock-tests" element={<ProtectedRoute><MockSelection /></ProtectedRoute>} />
      <Route path="/mock-tests/start" element={<ProtectedRoute><MockStart /></ProtectedRoute>} />
      <Route path="/mock-tests/result" element={<ProtectedRoute><MockResult /></ProtectedRoute>} />
      <Route path="/study-planner" element={<ProtectedRoute><PlannerHome /></ProtectedRoute>} />
      <Route path="/study-planner/calendar" element={<ProtectedRoute><PlannerCalendar /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><ChatScreen /></ProtectedRoute>} />
      <Route path="/set-password" element={<SetPassword />} />
      </Routes>
      </ThemeProvider>
        );
      }