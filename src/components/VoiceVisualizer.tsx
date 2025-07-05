import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff } from 'lucide-react'

interface VoiceVisualizerProps {
  isActive: boolean
  isSpeaking: boolean
  onClick: () => void
}

const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({
  isActive,
  isSpeaking,
  onClick
}) => {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <motion.div
            onClick={onClick}
            className="relative cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Main Voice Ball */}
            <motion.div
              className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
                isSpeaking
                  ? 'bg-gradient-to-r from-orange-500 via-red-500 to-pink-500'
                  : 'bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500'
              }`}
              animate={{
                scale: isSpeaking ? [1, 1.1, 1] : 1,
              }}
              transition={{
                duration: 0.8,
                repeat: isSpeaking ? Infinity : 0,
                ease: "easeInOut"
              }}
            >
              {/* Icon */}
              <motion.div
                animate={{ rotate: isSpeaking ? [0, 5, -5, 0] : 0 }}
                transition={{
                  duration: 0.5,
                  repeat: isSpeaking ? Infinity : 0,
                  ease: "easeInOut"
                }}
              >
                <Mic className="h-6 w-6 text-white" />
              </motion.div>

              {/* Pulsing Rings */}
              <AnimatePresence>
                {isActive && (
                  <>
                    {[1, 2, 3].map((ring) => (
                      <motion.div
                        key={ring}
                        className={`absolute inset-0 rounded-full border-2 ${
                          isSpeaking
                            ? 'border-orange-300'
                            : 'border-emerald-300'
                        }`}
                        initial={{ scale: 1, opacity: 0.8 }}
                        animate={{
                          scale: [1, 2, 3],
                          opacity: [0.8, 0.3, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: ring * 0.3,
                          ease: "easeOut"
                        }}
                      />
                    ))}
                  </>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Fluid Blob Background */}
            <motion.div
              className={`absolute inset-0 rounded-full blur-xl transition-all duration-500 ${
                isSpeaking
                  ? 'bg-gradient-to-r from-orange-400/30 via-red-400/30 to-pink-400/30'
                  : 'bg-gradient-to-r from-emerald-400/30 via-blue-400/30 to-purple-400/30'
              }`}
              animate={{
                scale: isSpeaking ? [1, 1.3, 1] : [1, 1.1, 1],
                rotate: [0, 180, 360],
              }}
              transition={{
                scale: {
                  duration: isSpeaking ? 0.8 : 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                },
                rotate: {
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear"
                }
              }}
            />

            {/* Slimy Morphing Effect */}
            <motion.div
              className={`absolute inset-0 rounded-full transition-all duration-300 ${
                isSpeaking
                  ? 'bg-gradient-to-r from-orange-500/20 via-red-500/20 to-pink-500/20'
                  : 'bg-gradient-to-r from-emerald-500/20 via-blue-500/20 to-purple-500/20'
              }`}
              animate={{
                borderRadius: isSpeaking 
                  ? ["50%", "60% 40% 60% 40%", "40% 60% 40% 60%", "50%"]
                  : ["50%", "55% 45% 55% 45%", "45% 55% 45% 55%", "50%"],
                scale: isSpeaking ? [1, 1.05, 0.95, 1] : [1, 1.02, 0.98, 1],
              }}
              transition={{
                duration: isSpeaking ? 1.5 : 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />

            {/* Audio Wave Bars (when speaking) */}
            <AnimatePresence>
              {isSpeaking && (
                <div className="absolute -left-20 top-1/2 transform -translate-y-1/2 flex items-end space-x-1">
                  {[1, 2, 3, 4, 5].map((bar) => (
                    <motion.div
                      key={bar}
                      className="w-1 bg-gradient-to-t from-orange-500 to-red-500 rounded-full"
                      initial={{ height: 4 }}
                      animate={{
                        height: [4, 16, 8, 20, 4],
                      }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        delay: bar * 0.1,
                        ease: "easeInOut"
                      }}
                    />
                  ))}
                </div>
              )}
            </AnimatePresence>

            {/* Status Text */}
            <motion.div
              className="absolute -top-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <div className={`px-3 py-1 rounded-full text-xs font-medium text-white shadow-lg ${
                isSpeaking
                  ? 'bg-gradient-to-r from-orange-500 to-red-500'
                  : 'bg-gradient-to-r from-emerald-500 to-blue-500'
              }`}>
                {isSpeaking ? '🗣️ Speaking...' : '👂 Listening...'}
              </div>
            </motion.div>

            {/* Floating Particles */}
            <div className="absolute inset-0 pointer-events-none">
              {[1, 2, 3, 4, 5, 6].map((particle) => (
                <motion.div
                  key={particle}
                  className={`absolute w-1 h-1 rounded-full ${
                    isSpeaking ? 'bg-orange-400' : 'bg-emerald-400'
                  }`}
                  style={{
                    left: `${20 + (particle * 10)}%`,
                    top: `${20 + (particle * 8)}%`,
                  }}
                  animate={{
                    y: [-10, -30, -10],
                    x: [0, 10, -10, 0],
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: particle * 0.5,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default VoiceVisualizer