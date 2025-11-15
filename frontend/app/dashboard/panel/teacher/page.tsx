"use client";

import { useState } from "react";
import { BookOpen, Users, TrendingUp, Award, Clock, CheckCircle } from "lucide-react";

export default function DashboardTeacher() {
  const [activeTab, setActiveTab] = useState<"overview" | "courses" | "students">("overview");

  const stats = [
    { label: "Total Courses", value: "12", icon: BookOpen, color: "bg-blue-500" },
    { label: "Active Students", value: "248", icon: Users, color: "bg-green-500" },
    { label: "Avg. Completion", value: "78%", icon: TrendingUp, color: "bg-purple-500" },
    { label: "Certificates", value: "156", icon: Award, color: "bg-orange-500" },
  ];

  const courses = [
    { id: 1, name: "Web Development Fundamentals", students: 45, progress: 85, status: "Active" },
    { id: 2, name: "Advanced React Patterns", students: 32, progress: 62, status: "Active" },
    { id: 3, name: "Database Design & SQL", students: 38, progress: 91, status: "Active" },
    { id: 4, name: "UI/UX Design Principles", students: 28, progress: 45, status: "Active" },
  ];

  const students = [
    { id: 1, name: "Ahmad Fauzi", course: "Web Development", progress: 92, lastActive: "2 hours ago" },
    { id: 2, name: "Siti Nurhaliza", course: "Advanced React", progress: 78, lastActive: "1 day ago" },
    { id: 3, name: "Budi Santoso", course: "Database Design", progress: 88, lastActive: "5 hours ago" },
    { id: 4, name: "Dewi Lestari", course: "UI/UX Design", progress: 65, lastActive: "3 hours ago" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Teacher Dashboard</h1>
          <p className="text-slate-600">Welcome back! Here what happening with your courses.</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-8 bg-white p-2 rounded-xl shadow-sm">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === "overview"
                ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            📊 Overview
          </button>
          <button
            onClick={() => setActiveTab("courses")}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === "courses"
                ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            📚 Courses
          </button>
          <button
            onClick={() => setActiveTab("students")}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === "students"
                ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            👥 Students
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === "overview" && (
            <div className="space-y-6 animate-fade-in">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`${stat.color} p-3 rounded-xl`}>
                        <stat.icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <p className="text-slate-600 text-sm mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Recent Activity</h2>
                <div className="space-y-4">
                  {[
                    { text: "New student enrolled in Web Development course", time: "10 minutes ago", icon: Users },
                    { text: "Quiz submitted for Advanced React module", time: "1 hour ago", icon: CheckCircle },
                    { text: "Assignment deadline approaching in 2 days", time: "3 hours ago", icon: Clock },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <activity.icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-slate-800 font-medium">{activity.text}</p>
                        <p className="text-slate-500 text-sm">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "courses" && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">My Courses</h2>
                <button className="bg-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30">
                  + New Course
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-bold text-slate-800">{course.name}</h3>
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                        {course.status}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Users className="w-4 h-4" />
                        <span className="text-sm">{course.students} students enrolled</span>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-slate-600">Average Progress</span>
                          <span className="font-bold text-slate-800">{course.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${course.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    <button className="w-full mt-4 bg-slate-100 text-slate-800 py-3 rounded-xl font-medium hover:bg-slate-200 transition-colors">
                      Manage Course
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "students" && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Student Progress</h2>
              
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">Student Name</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">Course</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">Progress</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">Last Active</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {students.map((student) => (
                        <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                {student.name.charAt(0)}
                              </div>
                              <span className="font-medium text-slate-800">{student.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-600">{student.course}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-24 bg-slate-200 rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                                  style={{ width: `${student.progress}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-bold text-slate-800">{student.progress}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-600 text-sm">{student.lastActive}</td>
                          <td className="px-6 py-4">
                            <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}