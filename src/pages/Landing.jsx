import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, Shield, Cpu, CreditCard, ArrowRight, ChevronRight } from "lucide-react";
import GlassCard from "../components/GlassCard";
import NeonBackground from "../components/NeonBackground";

export default function Landing() {
  const features = [
    {
      title: "Hyper-Speed Servers",
      description: "Dedicated NVMe cores with 99.99% uptime guarantee.",
      icon: Cpu,
    },
    {
      title: "Ironclad Security",
      description: "DDoS protection and automated daily backups included.",
      icon: Shield,
    },
    {
      title: "Instant Payments",
      description: "Seamless deposits via M-Pesa STK Push.",
      icon: CreditCard,
    },
  ];

  const stats = [
    { value: "99.99%", label: "Uptime SLA" },
    { value: "24/7", label: "Support" },
    { value: "60s", label: "Deployment" },
    { value: "15+", label: "Locations" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <NeonBackground intensity={0.6} />

      <nav className="fixed w-full z-50 bg-background/95 backdrop-blur-md border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <motion.div
                className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/5 border border-primary/20"
                animate={{ boxShadow: ['0 0 10px hsl(120 100% 50% / 0.2)', '0 0 20px hsl(120 100% 50% / 0.3)', '0 0 10px hsl(120 100% 50% / 0.2)'] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Zap className="h-6 w-6 text-primary/90" />
              </motion.div>
              <span className="ml-3 text-xl font-display font-bold tracking-widest text-primary/90">
                WOLF<span className="text-primary/70">HOST</span>
              </span>
            </div>
            <div className="flex space-x-2 sm:space-x-3">
              <Link to="/login">
                <button className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-primary/80 hover:text-primary hover:bg-primary/5 rounded-lg border border-primary/20 transition-colors duration-200">
                  Log In
                </button>
              </Link>
              <Link to="/register">
                <button className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg transition-all duration-200">
                  Get Started
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative pt-32 pb-20 sm:pt-40 sm:pb-24">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight mb-6"
          >
            POWER YOUR <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-primary/90 via-primary to-primary/70 bg-clip-text text-transparent">
              DIGITAL EMPIRE
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground font-mono"
          >
            Premium hosting infrastructure for the next generation. 
            Deploy servers in seconds. Pay with crypto or mobile money.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mt-10 flex flex-col sm:flex-row justify-center gap-4"
          >
            <Link to="/register">
              <motion.button
                className="px-6 py-3 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg flex items-center gap-2 transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Deploy Now 
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
            <Link to="/login">
              <motion.button 
                className="px-6 py-3 text-foreground/80 hover:text-foreground hover:bg-foreground/5 border border-border rounded-lg transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Client Area
              </motion.button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto"
          >
            {stats.map((stat, index) => (
              <GlassCard key={index} className="text-center p-4" hover={true}>
                <div className="text-2xl sm:text-3xl font-bold text-primary/90">{stat.value}</div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</div>
              </GlassCard>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 1 }}
            className="mt-16 max-w-6xl mx-auto"
          >
            <GlassCard className="relative" hover={false}>
              <div className="relative overflow-hidden rounded-lg">
                <div className="w-full h-48 bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <motion.div
                      className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary/5 border border-primary/20 mb-4"
                      animate={{ boxShadow: ['0 0 10px hsl(120 100% 50% / 0.2)', '0 0 20px hsl(120 100% 50% / 0.3)', '0 0 10px hsl(120 100% 50% / 0.2)'] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <Zap className="h-8 w-8 text-primary/90" />
                    </motion.div>
                    <p className="text-muted-foreground font-mono text-sm">
                      
                    </p>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>

      <div className="py-20 bg-background/50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
              <span className="bg-gradient-to-r from-primary/90 via-primary to-primary/70 bg-clip-text text-transparent">
                Enterprise-Grade Infrastructure
              </span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Built with cutting-edge technology for maximum performance and reliability
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, i) => (
              <GlassCard key={i} className="p-6" hover={true}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="group"
                >
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-primary/5 border border-primary/20 mb-6 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="h-7 w-7 text-primary/90" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary/90 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="mt-4 flex items-center text-primary/80 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <span className="text-sm">Learn more</span>
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </motion.div>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>

      <div className="py-20 bg-gradient-to-b from-background/50 to-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <GlassCard className="p-8" hover={false}>
            <h3 className="text-2xl sm:text-3xl font-display font-bold mb-6">
              Ready to Deploy Your Infrastructure?
            </h3>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of developers and businesses who trust WolfHost for their hosting needs.
            </p>
            <Link to="/register">
              <motion.button
                className="px-8 py-3 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg flex items-center gap-2 transition-all duration-200 mx-auto"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Start Your Journey
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
          </GlassCard>
        </div>
      </div>

      <footer className="bg-background border-t border-border/30 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-6 md:mb-0">
              <motion.div
                className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/5 border border-primary/20"
                animate={{ boxShadow: ['0 0 10px hsl(120 100% 50% / 0.2)', '0 0 20px hsl(120 100% 50% / 0.3)', '0 0 10px hsl(120 100% 50% / 0.2)'] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Zap className="h-6 w-6 text-primary/90" />
              </motion.div>
              <span className="ml-3 text-lg font-display font-bold tracking-widest text-primary/90">
                WOLF<span className="text-primary/70">HOST</span>
              </span>
            </div>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-sm text-muted-foreground">
              <Link to="/login" className="hover:text-foreground transition-colors duration-200">
                Login
              </Link>
              <Link to="/register" className="hover:text-foreground transition-colors duration-200">
                Register
              </Link>
              <a href="#" className="hover:text-foreground transition-colors duration-200">
                Documentation
              </a>
              <a href="#" className="hover:text-foreground transition-colors duration-200">
                Support
              </a>
              <a href="#" className="hover:text-foreground transition-colors duration-200">
                Status
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border/30 text-center">
            <p className="text-muted-foreground font-mono text-sm">
              &copy; {new Date().getFullYear()} WolfHost Infrastructure. All systems operational.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
