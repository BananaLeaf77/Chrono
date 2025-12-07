"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Users, Clock, AlertCircle } from "lucide-react";
import InstrumenIcon from "../dashboard/components/InstrumenIcon";

interface Instrument {
  Name: string;
}

interface Package {
  ID: number;
  Name: string;
  Price: number;
  Duration: number;
  Description: string;
  Instrument: Instrument;
}

export default function PackagesSection() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/packages`);
        if (!response.ok) {
          throw new Error("Failed to fetch packages");
        }
        const data = await response.json();
        // Assuming the API returns { data: [...] } or just [...]
        setPackages(data.data || data);
      } catch (err) {
        console.error("Error fetching packages:", err);
        setError("Failed to load packages. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  if (loading) {
    return (
      <section className="py-12 md:py-20 bg-gradient-to-b from-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-12 md:py-20 bg-gradient-to-b from-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 text-center">
             <div className="flex flex-col items-center justify-center text-red-500">
                <AlertCircle className="w-10 h-10 mb-2" />
                <p>{error}</p>
             </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 md:py-20 bg-gradient-to-b from-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 md:mb-4">
            Popular Music Classes
          </h2>
          <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto px-4">
            Discover our most popular classes and start your musical journey today
          </p>
        </div>
        
        {packages.length === 0 ? (
             <div className="text-center text-gray-500">No packages available at the moment.</div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {packages.map((pkg, index) => (
                <motion.div
                key={pkg.ID}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-300 flex flex-col"
                >
                <div className="h-40 md:h-48 bg-purple-200 relative overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-90"></div>
                    <div className="relative z-10 transform group-hover:scale-110 transition-transform duration-300">
                        <InstrumenIcon 
                            instrumentName={pkg.Instrument?.Name || "music"} 
                            className="w-16 h-16 md:w-20 md:h-20 text-white opacity-90" 
                        />
                    </div>
                </div>
                <div className="p-5 md:p-6 flex-1 flex flex-col">
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">
                    {pkg.Name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{pkg.Description}</p>
                    
                    <div className="space-y-2 mb-6 flex-1">
                    <div className="flex items-center text-sm md:text-base text-gray-600">
                        <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 mr-2 text-purple-500" />
                        <span>
                        {pkg.Duration} Minutes
                        </span>
                    </div>
                    <div className="flex items-center text-sm md:text-base text-gray-600">
                        <Users className="w-3.5 h-3.5 md:w-4 md:h-4 mr-2 text-purple-500" />
                        <span>All Levels</span>
                    </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-100">
                    <span className="text-xl md:text-2xl font-bold text-purple-600">
                        Rp {pkg.Price.toLocaleString('id-ID')}
                    </span>
                    <button className="px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md hover:shadow-lg">
                        Book Now
                    </button>
                    </div>
                </div>
                </motion.div>
            ))}
            </div>
        )}
      </div>
    </section>
  );
}
