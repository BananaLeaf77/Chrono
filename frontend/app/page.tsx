"use client";

import Link from "next/link";
import {
  Music2,
  Star,
  BookOpen,
  Users,
  ArrowRight,
  Calendar,
  Clock,
  User,
} from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

const features = [
  {
    icon: <Music2 className="w-5 h-5 md:w-6 md:h-6" />,
    title: "Expert Instructors",
    description: "Learn from professional musicians with years of experience",
  },
  {
    icon: <Star className="w-5 h-5 md:w-6 md:h-6" />,
    title: "Diverse Courses",
    description: "From piano to guitar, find the perfect instrument for you",
  },
  {
    icon: <BookOpen className="w-5 h-5 md:w-6 md:h-6" />,
    title: "Flexible Learning",
    description: "Choose your preferred schedule and learning pace",
  },
  {
    icon: <Users className="w-5 h-5 md:w-6 md:h-6" />,
    title: "Community",
    description: "Connect with fellow music enthusiasts and learn together",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-lg z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 md:h-16">
            <div className="flex items-center gap-2 md:gap-3">
              <Image
                src="/MadeU.png"
                alt="MusicMasters Logo"
                width={15}
                height={15}
                className="w-6 h-6 md:w-8 md:h-8"
                priority={true}
              />
              <h1 className="text-xl md:text-3xl lg:text-4xl font-black tracking-tight">
                <span className="text-[#1a1464]">MAD</span>
                <span className="bg-gradient-to-r from-[#f5a623] to-[#f7c948] text-transparent bg-clip-text">
                  EU
                </span>
              </h1>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
              <Link
                href="/auth/login"
                className="px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base text-purple-600 hover:text-purple-700 font-medium"
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                className="px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 md:pt-32 pb-12 md:pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 md:mb-6">
              Begin Your Musical Journey{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                Today
              </span>
            </h1>
            <p className="text-base md:text-xl text-gray-600 mb-6 md:mb-8 max-w-2xl mx-auto px-4">
              Book your music classes with top instructors and start your path
              to musical mastery. Learn at your own pace with personalized
              guidance.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4 px-4">
              <Link
                href="/auth/register"
                className="px-6 py-3 md:px-8 md:py-4 text-sm md:text-base bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
              >
                Start Learning <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5" />
              </Link>
              <Link
                href="/courses"
                className="px-6 py-3 md:px-8 md:py-4 text-sm md:text-base border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
              >
                Browse Courses
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Popular Classes Section */}
      <section className="py-12 md:py-20 bg-gradient-to-b from-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 md:mb-4">
              Popular Music Classes
            </h2>
            <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto px-4">
              Discover our most popular classes and start your musical journey
              today
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                name: "Piano Masterclass",
                price: "$29.99",
                duration: "1 hour",
                level: "All Levels",
                schedule: "Flexible",
              },
              {
                name: "Guitar Fundamentals",
                price: "$24.99",
                duration: "45 minutes",
                level: "Beginner",
                schedule: "Weekly",
              },
              {
                name: "Vocal Training",
                price: "$34.99",
                duration: "1 hour",
                level: "Intermediate",
                schedule: "Bi-weekly",
              },
            ].map((course, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-300"
              >
                <div className="h-40 md:h-48 bg-purple-200 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-90"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Music2 className="w-12 h-12 md:w-16 md:h-16 text-white opacity-50" />
                  </div>
                </div>
                <div className="p-5 md:p-6">
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">
                    {course.name}
                  </h3>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm md:text-base text-gray-600">
                      <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 mr-2" />
                      <span>
                        {course.duration} / {course.schedule}
                      </span>
                    </div>
                    <div className="flex items-center text-sm md:text-base text-gray-600">
                      <Users className="w-3.5 h-3.5 md:w-4 md:h-4 mr-2" />
                      <span>{course.level}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xl md:text-2xl font-bold text-purple-600">
                      {course.price}
                    </span>
                    <button className="px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                      Book Now
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 md:mb-4">
              Why Choose MusicMasters?
            </h2>
            <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto px-4">
              We provide everything you need to start your musical journey with
              confidence
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-5 md:p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 mb-3 md:mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm md:text-base text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 md:py-20 bg-gradient-to-b from-purple-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 md:mb-4">
              What Our Students Say
            </h2>
            <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto px-4">
              Read what our students have to say about their learning experience
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                text: "The instructors are amazing and the flexible schedule makes it easy to learn at my own pace.",
                name: "Alex Thompson",
                role: "Piano Student",
                rating: 5,
              },
              {
                text: "I've improved so much in just a few months. The personalized attention is incredible.",
                name: "Maria Garcia",
                role: "Vocal Student",
                rating: 5,
              },
              {
                text: "Great community of musicians. I've learned not just from my instructor but from fellow students too.",
                name: "David Kim",
                role: "Guitar Student",
                rating: 5,
              },
            ].map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-xl p-5 md:p-6 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center mb-3 md:mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={`${testimonial.name}-star-${i}`}
                      className="w-4 h-4 md:w-5 md:h-5 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
                <p className="text-sm md:text-base text-gray-600 mb-3 md:mb-4 italic">
                  &ldquo;{testimonial.text}&rdquo;
                </p>
                <div className="flex items-center">
                  <div className="w-9 h-9 md:w-10 md:h-10 bg-purple-200 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm md:text-base font-medium text-gray-900">
                      {testimonial.name}
                    </h4>
                    <p className="text-xs md:text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Schedule Preview Section */}
      <section className="py-12 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 md:mb-4">
              Flexible Class Schedule
            </h2>
            <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto px-4">
              Choose from various time slots that fit your schedule
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                day: "Morning",
                time: "09:00 - 12:00",
                slots: "Piano, Guitar, Violin",
              },
              {
                day: "Afternoon",
                time: "13:00 - 17:00",
                slots: "All Instruments",
              },
              {
                day: "Evening",
                time: "18:00 - 21:00",
                slots: "Guitar, Vocal, Drums",
              },
            ].map((schedule, index) => (
              <motion.div
                key={schedule.day}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg p-5 md:p-6 hover:shadow-xl transition-shadow border border-purple-100"
              >
                <div className="flex items-center mb-3 md:mb-4">
                  <Clock className="w-5 h-5 md:w-6 md:h-6 text-purple-600 mr-2" />
                  <h3 className="text-base md:text-lg font-bold text-gray-900">
                    {schedule.day} Sessions
                  </h3>
                </div>
                <div className="space-y-2">
                  <p className="text-sm md:text-base text-purple-600 font-medium">{schedule.time}</p>
                  <p className="text-sm md:text-base text-gray-600">Available Classes:</p>
                  <p className="text-sm md:text-base text-gray-500">{schedule.slots}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-20 bg-gradient-to-r from-purple-600 to-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 md:mb-4">
            Ready to Start Your Musical Journey?
          </h2>
          <p className="text-sm md:text-base text-purple-100 mb-6 md:mb-8 max-w-2xl mx-auto px-4">
            Join thousands of students who are already learning and growing with
            us. Start your free trial today!
          </p>
          <Link
            href="/auth/register"
            className="inline-block px-6 py-3 md:px-8 md:py-4 text-sm md:text-base bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-medium"
          >
            Get Started Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center">
                <Music2 className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
                <span className="ml-2 text-base md:text-lg font-bold text-gray-900">
                  MusicMasters
                </span>
              </div>
              <p className="mt-3 md:mt-4 text-sm md:text-base text-gray-600">
                Empowering musicians of tomorrow through quality education
                today.
              </p>
            </div>
            <div>
              <h3 className="text-xs md:text-sm font-semibold text-gray-900 uppercase tracking-wider">
                Courses
              </h3>
              <ul className="mt-3 md:mt-4 space-y-2">
                <li>
                  <Link
                    href="/courses/piano"
                    className="text-sm md:text-base text-gray-600 hover:text-purple-600"
                  >
                    Piano
                  </Link>
                </li>
                <li>
                  <Link
                    href="/courses/guitar"
                    className="text-sm md:text-base text-gray-600 hover:text-purple-600"
                  >
                    Guitar
                  </Link>
                </li>
                <li>
                  <Link
                    href="/courses/violin"
                    className="text-sm md:text-base text-gray-600 hover:text-purple-600"
                  >
                    Violin
                  </Link>
                </li>
                <li>
                  <Link
                    href="/courses/drums"
                    className="text-sm md:text-base text-gray-600 hover:text-purple-600"
                  >
                    Drums
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs md:text-sm font-semibold text-gray-900 uppercase tracking-wider">
                Company
              </h3>
              <ul className="mt-3 md:mt-4 space-y-2">
                <li>
                  <Link
                    href="/about"
                    className="text-sm md:text-base text-gray-600 hover:text-purple-600"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="/careers"
                    className="text-sm md:text-base text-gray-600 hover:text-purple-600"
                  >
                    Careers
                  </Link>
                </li>
                <li>
                  <Link
                    href="/blog"
                    className="text-sm md:text-base text-gray-600 hover:text-purple-600"
                  >
                    Blog
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs md:text-sm font-semibold text-gray-900 uppercase tracking-wider">
                Legal
              </h3>
              <ul className="mt-3 md:mt-4 space-y-2">
                <li>
                  <Link
                    href="/privacy"
                    className="text-sm md:text-base text-gray-600 hover:text-purple-600"
                  >
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-sm md:text-base text-gray-600 hover:text-purple-600"
                  >
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-gray-200 text-center">
            <p className="text-sm md:text-base text-gray-600">
              © {new Date().getFullYear()} MusicMasters. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}