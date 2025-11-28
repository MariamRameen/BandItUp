import React, { useState } from 'react';
import Header from '../../components/Header';

export default function ManageTests() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');

  const tests = [
    {
      id: 'T001',
      title: 'Academic Mock Test - Set 1',
      type: 'Mock Test',
      difficulty: 'Advanced',
      status: 'Active',
      createdDate: '2024-10-01',
      totalAttempts: 245,
      avgScore: 6.8,
      questions: 80,
      duration: '2h 45m',
      createdBy: 'System'
    },
    {
      id: 'T002',
      title: 'General Training Practice - Set 1',
      type: 'Practice Test',
      difficulty: 'Intermediate',
      status: 'Active',
      createdDate: '2024-10-15',
      totalAttempts: 189,
      avgScore: 6.2,
      questions: 80,
      duration: '2h 45m',
      createdBy: 'Admin'
    },
    {
      id: 'T003',
      title: 'Speaking Practice - Accent Training',
      type: 'Speaking',
      difficulty: 'Beginner',
      status: 'Active',
      createdDate: '2024-11-01',
      totalAttempts: 567,
      avgScore: 6.5,
      questions: 20,
      duration: '45m',
      createdBy: 'AI Generated'
    },
    {
      id: 'T004',
      title: 'Writing Task 2 - Opinion Essays',
      type: 'Writing',
      difficulty: 'Advanced',
      status: 'Draft',
      createdDate: '2024-11-20',
      totalAttempts: 0,
      avgScore: 0,
      questions: 15,
      duration: '40m',
      createdBy: 'Admin'
    },
    {
      id: 'T005',
      title: 'Listening Practice - British Accent',
      type: 'Listening',
      difficulty: 'Intermediate',
      status: 'Active',
      createdDate: '2024-09-15',
      totalAttempts: 432,
      avgScore: 7.1,
      questions: 40,
      duration: '30m',
      createdBy: 'System'
    },
    {
      id: 'T006',
      title: 'Reading Comprehension - Academic',
      type: 'Reading',
      difficulty: 'Advanced',
      status: 'Archived',
      createdDate: '2024-08-10',
      totalAttempts: 321,
      avgScore: 6.9,
      questions: 40,
      duration: '60m',
      createdBy: 'System'
    }
  ];

  const filteredTests = tests.filter(test => {
    const matchesSearch = test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         test.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || test.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || test.status === selectedStatus;
    const matchesDifficulty = selectedDifficulty === 'all' || test.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesType && matchesStatus && matchesDifficulty;
  });

  const handleEditTest = (testId: any ) => {
    console.log('Edit test:', testId);
   
  };

  const handleChangeStatus = (testId :any, newStatus: any) => {
    console.log('Change status for test:', testId, 'to:', newStatus);
    
  };

  const handlePreviewTest = (testId:any) => {
    console.log('Preview test:', testId);
    // Implement preview functionality
  };

  const getStatusColor = (status:any) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Draft': return 'bg-yellow-100 text-yellow-800';
      case 'Archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getDifficultyColor = (difficulty: any) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <Header />
      
      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-[#333]">Test Management</h1>
            <p className="text-[#777] text-sm">Manage test content, questions, and configurations</p>
          </div>
          <div className="flex gap-3">
            <button className="bg-[#7D3CFF] text-white px-4 py-2 rounded-lg hover:bg-[#6B2FE6]">
              Export Tests
            </button>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
              Create New Test
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div className="lg:col-span-2">
              <input
                type="text"
                placeholder="Search by test title or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-[#E2D9FF] rounded-lg focus:outline-none focus:border-[#7D3CFF]"
              />
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-[#E2D9FF] rounded-lg focus:outline-none focus:border-[#7D3CFF]"
            >
              <option value="all">All Types</option>
              <option value="Mock Test">Mock Test</option>
              <option value="Practice Test">Practice Test</option>
              <option value="Speaking">Speaking</option>
              <option value="Writing">Writing</option>
              <option value="Listening">Listening</option>
              <option value="Reading">Reading</option>
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-[#E2D9FF] rounded-lg focus:outline-none focus:border-[#7D3CFF]"
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Archived">Archived</option>
            </select>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-4 py-2 border border-[#E2D9FF] rounded-lg focus:outline-none focus:border-[#7D3CFF]"
            >
              <option value="all">All Difficulty</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
          
          <div className="flex justify-between items-center text-sm text-[#777]">
            <span>Showing {filteredTests.length} of {tests.length} tests</span>
            <span>Sort by: Created Date</span>
          </div>
        </div>

        {/* Tests Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {filteredTests.map((test) => (
            <div key={test.id} className="bg-white rounded-2xl border border-[#F0E8FF] shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg text-[#333] mb-1">{test.title}</h3>
                    <p className="text-sm text-[#777]">ID: {test.id}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(test.status)}`}>
                      {test.status}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(test.difficulty)}`}>
                      {test.difficulty}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-[#777]">Type</p>
                    <p className="font-medium">{test.type}</p>
                  </div>
                  <div>
                    <p className="text-[#777]">Questions</p>
                    <p className="font-medium">{test.questions}</p>
                  </div>
                  <div>
                    <p className="text-[#777]">Duration</p>
                    <p className="font-medium">{test.duration}</p>
                  </div>
                  <div>
                    <p className="text-[#777]">Created By</p>
                    <p className="font-medium">{test.createdBy}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-[#777]">Total Attempts</p>
                    <p className="font-medium text-[#7D3CFF]">{test.totalAttempts}</p>
                  </div>
                  <div>
                    <p className="text-[#777]">Avg Score</p>
                    <p className="font-medium text-[#7D3CFF]">
                      {test.avgScore > 0 ? test.avgScore : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-[#F0E8FF]">
                  <span className="text-xs text-[#777]">Created: {test.createdDate}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePreviewTest(test.id)}
                      className="text-[#7D3CFF] hover:text-[#6B2FE6] text-sm"
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => handleEditTest(test.id)}
                      className="text-[#7D3CFF] hover:text-[#6B2FE6] text-sm"
                    >
                      Edit
                    </button>
                    <select
                      value={test.status}
                      onChange={(e) => handleChangeStatus(test.id, e.target.value)}
                      className="text-xs border border-[#E2D9FF] rounded px-2 py-1 focus:outline-none focus:border-[#7D3CFF]"
                    >
                      <option value="Active">Active</option>
                      <option value="Draft">Draft</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm text-center">
            <p className="text-2xl font-bold text-[#7D3CFF]">{tests.length}</p>
            <p className="text-sm text-[#777]">Total Tests</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm text-center">
            <p className="text-2xl font-bold text-[#7D3CFF]">
              {tests.filter(t => t.status === 'Active').length}
            </p>
            <p className="text-sm text-[#777]">Active Tests</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm text-center">
            <p className="text-2xl font-bold text-[#7D3CFF]">
              {tests.reduce((acc, test) => acc + test.totalAttempts, 0)}
            </p>
            <p className="text-sm text-[#777]">Total Attempts</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm text-center">
            <p className="text-2xl font-bold text-[#7D3CFF]">
              {(tests.reduce((acc, test) => acc + test.avgScore, 0) / tests.filter(t => t.avgScore > 0).length).toFixed(1)}
            </p>
            <p className="text-sm text-[#777]">Overall Avg Score</p>
          </div>
        </div>

       
        <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm mt-6">
          <h3 className="font-semibold text-lg mb-4">Test Creation Progress</h3>
          <div className="space-y-4">
            {[
              { name: 'Academic Mock Test - Set 3', progress: 75, status: 'Writing Questions' },
              { name: 'General Training - Set 2', progress: 40, status: 'Reviewing Content' },
              { name: 'Speaking Practice - Business', progress: 90, status: 'Final Review' }
            ].map((test, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">{test.name}</span>
                  <span className="text-[#777]">{test.progress}% - {test.status}</span>
                </div>
                <div className="w-full bg-[#EDE3FF] h-2 rounded-full">
                  <div 
                    className="bg-[#7D3CFF] h-full rounded-full" 
                    style={{ width: `${test.progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}