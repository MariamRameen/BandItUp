import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { Target, TrendingUp, Calendar, CheckCircle, Circle, Clock, ChevronRight, Star, Flag, RefreshCw } from 'lucide-react';

const API_URL = "http://localhost:4000/api/roadmap";
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token") ?? ""}` } });

interface Milestone {
  _id: string;
  weekNumber: number;
  targetOverall: number;
  skillTargets: {
    listening: number;
    reading: number;
    writing: number;
    speaking: number;
  };
  keyFocus: string[];
  tasks: string[];
  isCompleted: boolean;
  actualBand?: number;
  completedAt?: string;
}

interface RoadmapData {
  _id: string;
  baselineBand: number;
  currentBand: number;
  targetBand: number;
  estimatedWeeks: number;
  currentWeek: number;
  startDate: string;
  estimatedEndDate: string;
  progressPercentage: number;
  bandImprovement: number;
  milestones: Milestone[];
  overallStrategy: string;
  keyRecommendations: string[];
  estimatedStudyHoursPerWeek: number;
  status: string;
}

export default function PlannerRoadmap() {
  const navigate = useNavigate();
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [needsGeneration, setNeedsGeneration] = useState(false);

  useEffect(() => {
    loadRoadmap();
  }, []);

  const loadRoadmap = async () => {
    try {
      const res = await fetch(API_URL, auth());
      const data = await res.json();
      
      if (data.success) {
        setRoadmap(data.roadmap);
        setNeedsGeneration(false);
      } else if (data.needsGeneration) {
        setNeedsGeneration(true);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to load roadmap");
    } finally {
      setLoading(false);
    }
  };

  const generateRoadmap = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`${API_URL}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
        },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      
      if (data.success) {
        setRoadmap(data.roadmap);
        setNeedsGeneration(false);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to generate roadmap");
    } finally {
      setGenerating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getCurrentMilestoneIndex = () => {
    if (!roadmap) return 0;
    const incomplete = roadmap.milestones.findIndex(m => !m.isCompleted);
    return incomplete === -1 ? roadmap.milestones.length - 1 : incomplete;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F5FF] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7D3CFF]" />
      </div>
    );
  }

  // Generate roadmap prompt
  if (needsGeneration) {
    return (
      <div className="min-h-screen bg-[#F7F5FF]">
        <Header />
        <div className="max-w-xl mx-auto px-8 py-12">
          <div className="bg-white rounded-2xl p-8 border border-[#F0E8FF] shadow-sm text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-[#7D3CFF] to-[#9B59B6] rounded-full flex items-center justify-center">
              <Target size={40} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Create Your Roadmap</h2>
            <p className="text-[#777] mb-6">
              Let AI generate a personalized study roadmap based on your baseline test results and target band score.
            </p>
            <button
              onClick={generateRoadmap}
              disabled={generating}
              className="bg-gradient-to-r from-[#7D3CFF] to-[#6B2FE6] text-white px-8 py-4 rounded-xl font-semibold hover:from-[#6B2FE6] hover:to-[#5A20E0] transition-all disabled:opacity-50"
            >
              {generating ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  Generating...
                </span>
              ) : (
                "Generate My Roadmap"
              )}
            </button>
            {error && <p className="text-red-500 mt-4">{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  if (!roadmap) return null;

  const currentMilestoneIdx = getCurrentMilestoneIndex();

  return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <Header />

      <div className="max-w-6xl mx-auto px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link to="/study-planner" className="text-[#7D3CFF] hover:underline">← Back to Planner</Link>
            </div>
            <h1 className="text-2xl font-semibold text-[#333]">Your IELTS Roadmap</h1>
            <p className="text-[#777] text-sm">{roadmap.overallStrategy}</p>
          </div>
          <button
            onClick={generateRoadmap}
            disabled={generating}
            className="flex items-center gap-2 bg-[#F4F0FF] text-[#7D3CFF] px-4 py-2 rounded-lg hover:bg-[#E8DCFF]"
          >
            <RefreshCw size={16} className={generating ? 'animate-spin' : ''} />
            Regenerate
          </button>
        </div>

        {/* Progress Overview */}
        <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-2 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-500">{roadmap.baselineBand}</span>
              </div>
              <p className="text-sm text-[#777]">Baseline Band</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-2 bg-[#7D3CFF] rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{roadmap.currentBand}</span>
              </div>
              <p className="text-sm text-[#777]">Current Band</p>
              {roadmap.bandImprovement > 0 && (
                <span className="text-xs text-green-600">+{roadmap.bandImprovement} improvement</span>
              )}
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-2 bg-gradient-to-br from-[#7D3CFF] to-[#9B59B6] rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{roadmap.targetBand}</span>
              </div>
              <p className="text-sm text-[#777]">Target Band</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-2 bg-emerald-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-emerald-600">{roadmap.progressPercentage}%</span>
              </div>
              <p className="text-sm text-[#777]">Progress</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[#777]">Journey Progress</span>
              <span className="font-semibold">{roadmap.currentWeek} of {roadmap.estimatedWeeks} weeks</span>
            </div>
            <div className="w-full bg-[#EDE3FF] h-4 rounded-full">
              <div
                className="bg-gradient-to-r from-[#7D3CFF] to-[#9B59B6] h-full rounded-full transition-all duration-500"
                style={{ width: `${roadmap.progressPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-[#777] mt-1">
              <span>Started: {formatDate(roadmap.startDate)}</span>
              <span>Est. End: {formatDate(roadmap.estimatedEndDate)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Milestones Timeline */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
            <h3 className="font-semibold text-lg mb-6">Milestones</h3>

            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-[#EDE3FF]" />

              <div className="space-y-6">
                {roadmap.milestones.map((milestone, index) => {
                  const isCurrent = index === currentMilestoneIdx;
                  const isPast = index < currentMilestoneIdx;
                  
                  return (
                    <div key={milestone._id} className="relative pl-16">
                      {/* Timeline dot */}
                      <div className={`absolute left-4 w-5 h-5 rounded-full border-2 ${
                        milestone.isCompleted
                          ? 'bg-green-500 border-green-500'
                          : isCurrent
                          ? 'bg-[#7D3CFF] border-[#7D3CFF] ring-4 ring-[#7D3CFF]/20'
                          : 'bg-white border-[#E0E0E0]'
                      }`}>
                        {milestone.isCompleted && (
                          <CheckCircle className="w-4 h-4 text-white absolute -top-0.5 -left-0.5" />
                        )}
                      </div>

                      <div className={`border rounded-xl p-4 ${
                        isCurrent
                          ? 'border-[#7D3CFF] bg-[#F4F0FF]'
                          : milestone.isCompleted
                          ? 'border-green-200 bg-green-50'
                          : 'border-[#F0E8FF]'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              isCurrent
                                ? 'bg-[#7D3CFF] text-white'
                                : milestone.isCompleted
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              Week {milestone.weekNumber}
                            </span>
                            {isCurrent && <span className="text-xs text-[#7D3CFF] font-semibold">CURRENT</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <Target size={16} className="text-[#7D3CFF]" />
                            <span className="font-bold text-lg">{milestone.targetOverall}</span>
                            {milestone.actualBand && (
                              <span className={`text-sm ${
                                milestone.actualBand >= milestone.targetOverall
                                  ? 'text-green-600'
                                  : 'text-amber-600'
                              }`}>
                                (Actual: {milestone.actualBand})
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2 mb-3 text-xs">
                          <div className="text-center p-2 bg-white/50 rounded">
                            <p className="text-[#777]">L</p>
                            <p className="font-semibold">{milestone.skillTargets.listening}</p>
                          </div>
                          <div className="text-center p-2 bg-white/50 rounded">
                            <p className="text-[#777]">R</p>
                            <p className="font-semibold">{milestone.skillTargets.reading}</p>
                          </div>
                          <div className="text-center p-2 bg-white/50 rounded">
                            <p className="text-[#777]">W</p>
                            <p className="font-semibold">{milestone.skillTargets.writing}</p>
                          </div>
                          <div className="text-center p-2 bg-white/50 rounded">
                            <p className="text-[#777]">S</p>
                            <p className="font-semibold">{milestone.skillTargets.speaking}</p>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs text-[#777]">Focus Areas:</p>
                          <div className="flex flex-wrap gap-1">
                            {milestone.keyFocus.map((focus, i) => (
                              <span key={i} className="text-xs bg-white px-2 py-1 rounded-full border">
                                {focus}
                              </span>
                            ))}
                          </div>
                        </div>

                        {isCurrent && (
                          <div className="mt-3 pt-3 border-t border-[#7D3CFF]/20">
                            <Link
                              to="/mock-tests"
                              className="text-sm text-[#7D3CFF] hover:underline flex items-center gap-1"
                            >
                              Take Mock Test to Complete Milestone <ChevronRight size={14} />
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Final Target */}
                <div className="relative pl-16">
                  <div className="absolute left-4 w-5 h-5">
                    <Flag className="text-[#7D3CFF]" size={20} />
                  </div>
                  <div className="border-2 border-dashed border-[#7D3CFF] rounded-xl p-4 bg-gradient-to-r from-[#F4F0FF] to-white">
                    <div className="flex items-center gap-3">
                      <Star className="text-[#7D3CFF]" size={24} />
                      <div>
                        <p className="font-bold text-lg">Target Achieved: Band {roadmap.targetBand}</p>
                        <p className="text-sm text-[#777]">You're ready for your IELTS exam!</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Study Info */}
            <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
              <h3 className="font-semibold mb-4">Study Plan</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Clock className="text-[#7D3CFF]" size={20} />
                  <div>
                    <p className="font-semibold">{roadmap.estimatedStudyHoursPerWeek} hrs/week</p>
                    <p className="text-xs text-[#777]">Recommended study time</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="text-[#7D3CFF]" size={20} />
                  <div>
                    <p className="font-semibold">{roadmap.estimatedWeeks} weeks</p>
                    <p className="text-xs text-[#777]">Estimated duration</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
              <h3 className="font-semibold mb-4">Key Tips</h3>
              <div className="space-y-3">
                {roadmap.keyRecommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-[#7D3CFF] mt-1">•</span>
                    <p className="text-sm text-[#666]">{rec}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-[#7D3CFF] to-[#9B59B6] rounded-2xl p-6 text-white">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  to="/study-planner"
                  className="block w-full bg-white/20 hover:bg-white/30 py-2 px-4 rounded-lg text-center text-sm"
                >
                  View Weekly Tasks
                </Link>
                <Link
                  to="/mock-tests"
                  className="block w-full bg-white text-[#7D3CFF] py-2 px-4 rounded-lg text-center text-sm font-semibold"
                >
                  Take Mock Test
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
