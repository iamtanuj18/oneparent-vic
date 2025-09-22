// timeline section displaying community growth statistics
'use client'

import { motion } from 'framer-motion'
import React from 'react'
import { ANIMATION_CONFIG } from '@/lib/animation'

export function TimelineSection() {
  // fetch timeline data for display
  const [timelineData, setTimelineData] = React.useState<Array<{
    year: number;
    families: string;
    growth: string;
    bgColor: string;
    textColor: string;
  }> | null>(null);
  const [yearsOfGrowth, setYearsOfGrowth] = React.useState<number | null>(null);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    const loadData = async () => {
      try {
        const { fetchTimeline } = await import('../../lib/api/insights');
        
        // load timeline data for cards
        const timeline = await fetchTimeline();
        
        if (timeline && Array.isArray(timeline) && timeline.length > 0) {
          // define colors for progression
          const colors = [
            { bgColor: "bg-slate-50", textColor: "text-slate-600" },
            { bgColor: "bg-blue-50", textColor: "text-blue-600" },
            { bgColor: "bg-emerald-50", textColor: "text-emerald-600" },
            { bgColor: "bg-orange-50", textColor: "text-orange-600" },
            { bgColor: "bg-purple-50", textColor: "text-purple-600" }
          ];
          
          // take only first 5 items and process them
          const processedData = timeline.slice(0, 5).map((item, index) => {
            let growth = "baseline";
            if (index > 0) {
              const previousValue = timeline[index - 1].total_families_k;
              const currentValue = item.total_families_k;
              const growthPercent = Math.round(((currentValue - previousValue) / previousValue) * 100);
              // only show + for positive, - for negative, no double signs
              if (growthPercent > 0) {
                growth = `+${growthPercent}%`;
              } else if (growthPercent < 0) {
                growth = `${growthPercent}%`; // already has negative sign
              } else {
                growth = "0%";
              }
            }
            
            const colorIndex = Math.min(index, colors.length - 1);
            
            return {
              year: item.year,
              families: `${Math.round(item.total_families_k)}k`,
              growth,
              bgColor: colors[colorIndex].bgColor,
              textColor: colors[colorIndex].textColor
            };
          });
          
          setTimelineData(processedData);
          
          // calculate years of growth dynamically
          const firstYear = timeline[0].year;
          const lastYear = timeline[timeline.length - 1].year;
          const totalYears = lastYear - firstYear;
          setYearsOfGrowth(totalYears);
        } else {
          setFetchError('Could not load timeline data.');
        }
        
      } catch (err) {
        setFetchError('Could not load data.');
      }
    };

    loadData();
  }, []);

  return (
    <section id="community-insights" className="relative py-16 lg:py-24 bg-orange-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: ANIMATION_CONFIG.duration }}
          viewport={{ once: true, margin: "-50px" }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight max-w-4xl mx-auto mb-6">
            You're Part of a{" "}
            <span className="gradient-text">
              Growing Community
            </span>
          </h2>
          <p className="text-xl text-gray-600 leading-relaxed max-w-4xl mx-auto">
            Every family counts. Every story matters. You're not alone in this journey.
          </p>
        </motion.div>

        {/* simple context for the timeline cards */}
        <div className="text-center mb-12">
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {yearsOfGrowth 
              ? `Victoria's single parent family growth over ${yearsOfGrowth} years`
              : "Victoria's single parent family growth over time"
            }
          </p>
        </div>
        
        {/* timeline cards with data from backend */}
        {timelineData && timelineData.length > 0 ? (
          <div className="flex justify-center items-end gap-4 mb-20 flex-wrap">
            {timelineData.map((item, index) => (
              <motion.div
                key={item.year}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`${item.bgColor} rounded-2xl p-4 text-center min-w-[140px] max-w-[160px] border border-white/50 shadow-lg flex-shrink-0 flex flex-col justify-between`}
                style={{ height: `${130 + index * 25}px` }}
              >
                {/* year at top */}
                <div className={`text-lg font-bold ${item.textColor}`}>
                  {item.year}
                </div>
                
                {/* family count - main focus */}
                <div className="flex-1 flex flex-col justify-center">
                  <div className={`text-3xl font-bold ${item.textColor} mb-1`}>
                    {item.families}
                  </div>
                  <div className="text-sm text-gray-600">
                    families
                  </div>
                </div>
                
                {/* growth at bottom */}
                {item.growth !== "baseline" && (
                  <div className={`text-sm font-semibold ${item.textColor} bg-white/60 rounded-full px-3 py-1`}>
                    {item.growth}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            {fetchError ? (
              <p className="text-gray-500">{fetchError}</p>
            ) : (
              <p className="text-gray-500">Loading timeline data...</p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}