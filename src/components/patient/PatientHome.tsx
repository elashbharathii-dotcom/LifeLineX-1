import React, { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useEmergency } from '../../context/EmergencyContext';
import { appointmentService } from '../../services/appointmentService';
import { pregnancyService } from '../../services/pregnancyService';
import { hospitalService } from '../../services/hospitalService';
import { dbAdapter } from '../../services/databaseAdapter';
import { Doctor } from '../../types/database';
import {
  Heart,
  Calendar,
  MapPin,
  Baby,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Building,
  Shield,
  Clock,
  Radio,
  Truck,
  Droplet,
  Stethoscope,
  Star,
} from 'lucide-react';

interface PatientHomeProps {
  onNavigate: (tabId: string) => void;
}

export const PatientHome: React.FC<PatientHomeProps> = ({ onNavigate }) => {
  const { profile } = useAuth();
  const { activeEmergency } = useEmergency();

  const profileId = profile?.id;

  const appointments = useMemo(() => {
    return profileId ? appointmentService.getAppointments(profileId).slice(0, 3) : [];
  }, [profileId]);

  const pregnancyProfile = useMemo(() => {
    if (!profileId) return null;
    return pregnancyService.getActiveProfile(profileId);
  }, [profileId]);

  const nearbyHospitals = useMemo(() => {
    return hospitalService.getAllHospitals().slice(0, 3);
  }, []);

  const doctors: Doctor[] = useMemo(() => {
    return dbAdapter.getTable('doctors').slice(0, 4);
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = profile?.full_name ? profile.full_name.split(' ')[0] : 'Rahul';

  const bloodGroup = profile?.blood_group || 'O+';
  const emergencyContactName = profile?.emergency_contact_name || 'Ananya Sharma';
  const emergencyContactPhone = profile?.emergency_contact_phone || '+91 98765 43219';

  return (
    <div className="space-y-12 pb-16 max-w-7xl mx-auto lx-animate-in">
      {/* ─── Top Greeting Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {greeting}, {firstName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            How can LifelineX help you today?
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Network Active</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <Shield className="w-3.5 h-3.5 text-[#0F4C47] dark:text-[#E2F2A4]" />
            <span>My Health: Blood Profile {bloodGroup}</span>
          </div>
        </div>
      </div>

      {/* ─── SECTION 1: HERO SECTION ─────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-[32px] p-6 sm:p-10 lg:p-12 shadow-sm relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Editorial Copy */}
          <div className="lg:col-span-7 space-y-6">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E2F2A4] text-[#243E17] text-xs font-extrabold tracking-wide uppercase shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#243E17]" />
              <span>Medicine for all • Emergency &amp; Care Network</span>
            </div>

            {/* Headline */}
            <h2 className="text-3xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight text-slate-950 dark:text-white leading-[1.12]">
              Your health.{' '}
              <span className="text-[#0F4C47] dark:text-[#E2F2A4] underline decoration-[#E2F2A4]/60 dark:decoration-[#0F4C47]/80 decoration-wavy">
                Connected
              </span>{' '}
              when it matters.
            </h2>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
              LifelineX connects you with emergency assistance, healthcare facilities, blood resources and trusted care services.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                onClick={() => onNavigate('emergency')}
                className="lx-btn lx-btn-emergency lx-btn-lg flex items-center gap-2.5 cursor-pointer group"
              >
                <Radio className="w-4 h-4 text-white animate-pulse" />
                <span>GET EMERGENCY HELP</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 text-white" />
              </button>

              <button
                onClick={() => onNavigate('discovery')}
                className="lx-btn lx-btn-primary lx-btn-lg flex items-center gap-2 cursor-pointer"
              >
                <span>EXPLORE HEALTHCARE</span>
                <ArrowUpRight className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Trust Proof */}
            <div className="pt-4 flex items-center gap-4">
              <div className="flex -space-x-2 overflow-hidden">
                <img
                  className="inline-block h-9 w-9 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover"
                  src="/images/friendly_doctor_portrait.jpg"
                  alt="Doctor avatar"
                />
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#0F4C47] text-white text-[11px] font-bold ring-2 ring-white dark:ring-slate-900">
                  +68
                </div>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                <strong className="text-slate-900 dark:text-white font-bold">&gt; 68 verified specialists</strong> &amp; trauma centers across the network
              </div>
            </div>
          </div>

          {/* Right Column: Hero Photographic Image */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-[28px] overflow-hidden shadow-2xl border border-slate-200/90 dark:border-slate-800 aspect-square sm:aspect-[4/3] lg:aspect-square bg-slate-100 dark:bg-slate-800">
              <img
                src="/images/medical_team_hero.jpg"
                alt="LifelineX Professional Medical Care Team"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />

              {/* Floating Quality Badge */}
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl p-3.5 border border-white/60 dark:border-slate-700 shadow-lg flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                      <span>4.9 ★</span>
                      <span className="text-slate-400 font-normal">Verified Trauma Network</span>
                    </div>
                    <div className="text-[10px] text-slate-500">Continuous dispatch readiness</div>
                  </div>
                </div>
                <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-1 rounded-lg">
                  24/7 Active
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 2: THREE EDITORIAL FEATURE CARDS (TRIO) ──────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Empathy & Care */}
        <div className="rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 flex flex-col justify-between shadow-xs overflow-hidden relative">
          <div className="space-y-3 z-10">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-snug">
              Personal approach with care and trust
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Consultation and follow-up care after emergency admission or routine specialist visit.
            </p>
          </div>
          <div className="mt-5 rounded-2xl overflow-hidden h-36 border border-slate-100 dark:border-slate-800">
            <img
              src="/images/doctor_consultation_scene.jpg"
              alt="Medical consultation"
              className="w-full h-full object-cover object-top"
            />
          </div>
        </div>

        {/* Card 2: Soft Mint Pathway Checklists */}
        <div className="rounded-[28px] bg-[#EBF7D0] border border-[#D4E89B] p-6 flex flex-col justify-between shadow-xs text-[#223B15]">
          <div className="space-y-3">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#223B15]/80">
              Checklists &amp; Pathways:
            </div>
            <h3 className="text-lg font-extrabold leading-snug text-[#223B15]">
              Integrated clinical directions
            </h3>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['Emergency SOS', 'Pregnancy Care', 'Blood Registry', 'Neonatal & ICU', 'Cardiology', 'Quick Actions'].map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-full bg-white/70 text-[#223B15] text-[11px] font-bold shadow-2xs"
                >
                  • {tag}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={() => onNavigate('discovery')}
            className="mt-6 inline-flex items-center gap-1.5 text-xs font-extrabold text-[#223B15] hover:underline cursor-pointer"
          >
            <span>Learn more about services</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 3: Quality & Standards */}
        <div className="rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 flex flex-col justify-between shadow-xs">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
              <Stethoscope className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-snug">
              High-standard clinical trauma care
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Certified hospital protocols, immediate emergency coordination, and continuous doctor readiness for rapid intervention.
            </p>
          </div>
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Accredited Network</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
        </div>
      </section>

      {/* ─── SECTION 3: PROMINENT EMERGENCY CARD ──────────────────────────── */}
      <section
        className="rounded-[32px] p-6 sm:p-8 border shadow-md relative overflow-hidden transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
        style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(255, 255, 255, 0.95) 100%)',
          borderColor: 'rgba(239, 68, 68, 0.3)',
        }}
      >
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider bg-rose-600 text-white uppercase shadow-sm">
              NEED HELP NOW?
            </span>
            {activeEmergency ? (
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                Active SOS: {activeEmergency.status.replace(/_/g, ' ')}
              </span>
            ) : (
              <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold">Priority Dispatch Ready</span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-900">
            Need immediate help?
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Get emergency assistance from LifelineX. Instantly broadcast trauma SOS, acquire high-precision GPS coordinates, and notify the nearest trauma hospital.
          </p>
          <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1 font-medium">
            <span className="flex items-center gap-1 text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" /> GPS Active
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-700">
              <Radio className="w-3.5 h-3.5 text-[#0F4C47]" /> Connected to Grid
            </span>
            <span>•</span>
            <span>Primary Contact: {emergencyContactName} ({emergencyContactPhone})</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
          <button
            onClick={() => onNavigate('emergency')}
            className="lx-btn lx-btn-emergency lx-btn-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <Radio className="w-4 h-4 animate-pulse text-white" />
            <span>GET EMERGENCY HELP</span>
          </button>
          <button
            onClick={() => onNavigate('discovery')}
            className="lx-btn lx-btn-secondary lx-btn-lg flex items-center justify-center cursor-pointer"
          >
            VIEW EMERGENCY SERVICES
          </button>
        </div>
      </section>

      {/* ─── SECTION 4: QUICK HEALTH SERVICES (REFERENCE GRID) ────────────── */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E2F2A4] text-[#243E17] text-xs font-bold uppercase tracking-wider">
              <span>● Services</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Healthcare, all in one place
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Wide spectrum of emergency, clinical, and primary medical capabilities
            </p>
          </div>
          <button
            onClick={() => onNavigate('discovery')}
            className="text-xs font-bold text-[#0F4C47] dark:text-[#E2F2A4] hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            <span>View all directory services</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left: 2x4 Services Grid */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                id: 'emergency',
                title: 'Emergency',
                desc: 'Get immediate trauma assistance',
                icon: <Radio className="w-5 h-5 text-rose-500" />,
                bg: 'bg-rose-50 dark:bg-rose-950/30',
              },
              {
                id: 'appointments',
                title: 'Appointments',
                desc: 'Manage your upcoming doctor care',
                icon: <Calendar className="w-5 h-5 text-blue-500" />,
                bg: 'bg-blue-50 dark:bg-blue-950/30',
              },
              {
                id: 'discovery',
                title: 'Hospitals',
                desc: 'Trauma centers & accredited beds',
                icon: <Building className="w-5 h-5 text-sky-500" />,
                bg: 'bg-sky-50 dark:bg-sky-950/30',
              },
              {
                id: 'bloodbank',
                title: 'Blood Banks',
                desc: 'Find available blood resources',
                icon: <Droplet className="w-5 h-5 text-rose-500" />,
                bg: 'bg-rose-50 dark:bg-rose-950/30',
              },
              {
                id: 'ambulance',
                title: 'Ambulance',
                desc: 'Realtime GPS fleet dispatch',
                icon: <Truck className="w-5 h-5 text-amber-500" />,
                bg: 'bg-amber-50 dark:bg-amber-950/30',
              },
              {
                id: 'map',
                title: 'Healthcare Map',
                desc: 'Interactive geolocated care network',
                icon: <MapPin className="w-5 h-5 text-emerald-500" />,
                bg: 'bg-emerald-50 dark:bg-emerald-950/30',
              },
              {
                id: 'donor',
                title: 'Donor Mode',
                desc: 'Universal voluntary donation',
                icon: <Heart className="w-5 h-5 text-purple-500" />,
                bg: 'bg-purple-50 dark:bg-purple-950/30',
              },
              {
                id: 'pregnancy',
                title: 'Pregnancy Care',
                desc: 'Personalized pregnancy support',
                icon: <Baby className="w-5 h-5 text-pink-500" />,
                bg: 'bg-pink-50 dark:bg-pink-950/30',
              },
            ].map((service) => (
              <button
                key={service.id}
                onClick={() => onNavigate(service.id)}
                className="group p-5 rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-[#0F4C47] dark:hover:border-[#E2F2A4] transition-all shadow-xs hover:shadow-md flex items-start justify-between text-left cursor-pointer"
              >
                <div className="space-y-3">
                  <div className={`w-11 h-11 rounded-2xl ${service.bg} flex items-center justify-center transition-transform group-hover:scale-105`}>
                    {service.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-[#0F4C47] dark:group-hover:text-[#E2F2A4] transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {service.desc}
                    </p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white group-hover:bg-[#E2F2A4] transition-all shrink-0">
                  <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </button>
            ))}
          </div>

          {/* Right: Friendly Doctor Portrait Banner */}
          <div className="lg:col-span-4 rounded-[28px] overflow-hidden relative shadow-sm border border-slate-200/80 dark:border-slate-800 bg-gradient-to-b from-[#F0F7E8] to-[#E5F2D9] dark:from-slate-900 dark:to-slate-950 flex flex-col justify-between">
            <div className="p-6 relative z-10">
              <span className="px-3 py-1 rounded-full bg-white/80 dark:bg-slate-800 text-[11px] font-bold text-[#243E17] dark:text-[#E2F2A4] shadow-xs">
                Verified Specialist
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-3">
                Expert medical consultation &amp; clinical trust
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Direct access to trauma directors, obstetricians, and general practitioners.
              </p>
            </div>
            <div className="relative mt-2 flex items-end justify-center overflow-hidden">
              <img
                src="/images/friendly_doctor_portrait.jpg"
                alt="Doctor specialist"
                className="w-full h-72 object-cover object-top"
              />
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#E5F2D9] dark:from-slate-950 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 5: EXPRESS DIAGNOSTICS & BLOOD REGISTRY ──────────────── */}
      <section className="rounded-[32px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-3 rounded-2xl overflow-hidden h-40 border border-slate-100 dark:border-slate-800">
            <img
              src="/images/doctor_consultation_scene.jpg"
              alt="Medical team diagnostics"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="md:col-span-5 space-y-3">
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Express Blood Registry &amp; Diagnostics
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              We provide real-time cold-chain visibility into screened blood bags, platelets, and emergency donor queues across certified regional blood banks.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => onNavigate('bloodbank')}
                className="lx-btn lx-btn-primary lx-btn-sm cursor-pointer"
              >
                Find Blood Resources
              </button>
              <button
                onClick={() => onNavigate('donor')}
                className="lx-btn lx-btn-secondary lx-btn-sm cursor-pointer"
              >
                Donate Blood
              </button>
            </div>
          </div>

          <div className="md:col-span-4 rounded-2xl bg-[#EBF7D0] border border-[#D4E89B] p-4 text-[#223B15]">
            <div className="text-[11px] font-extrabold uppercase tracking-wider mb-2">
              Available Blood Units
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['O+ Positive', 'O- Universal', 'A+ Positive', 'B+ Positive', 'AB+ Plasma', 'Platelets'].map((b) => (
                <span key={b} className="px-2 py-1 rounded-lg bg-white/80 text-[10px] font-bold">
                  {b}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 6: PREGNANCY CARE FEATURE ────────────────────────────── */}
      <section className="rounded-[32px] bg-gradient-to-br from-pink-50/70 to-white dark:from-slate-900 dark:to-slate-950 border border-pink-200/70 dark:border-slate-800 p-6 sm:p-10 shadow-sm relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 text-xs font-bold">
              <Baby className="w-3.5 h-3.5" />
              <span>Pregnancy care, connected</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Personalized pregnancy support &amp; obstetric safety
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
              Keep your pregnancy information, appointments, care team and emergency support in one place. One-touch obstetric SOS directly alerts your obstetrician and verified hospital.
            </p>

            {pregnancyProfile ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-pink-200 dark:border-slate-700">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Gestational Week</div>
                  <div className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                    Week {pregnancyProfile.pregnancy_week || 24}
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-pink-200 dark:border-slate-700">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Due Date</div>
                  <div className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                    {pregnancyProfile.due_date || '2026-10-15'}
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-pink-200 dark:border-slate-700">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Risk Level</div>
                  <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {pregnancyProfile.risk_level || 'LOW'}
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-pink-200 dark:border-slate-700">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Maternal Blood</div>
                  <div className="text-base font-extrabold text-rose-600 mt-0.5">
                    {pregnancyProfile.blood_group || bloodGroup}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-pink-500" /> Due Date Tracking</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-pink-500" /> Prenatal Appointments</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-pink-500" /> Dedicated Obstetric SOS</span>
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={() => onNavigate('pregnancy')}
                className="lx-btn lx-btn-primary flex items-center gap-2 cursor-pointer"
              >
                <Baby className="w-4 h-4" />
                <span>{pregnancyProfile ? 'OPEN PREGNANCY CARE' : 'SET UP PREGNANCY CARE'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-[28px] overflow-hidden shadow-xl border border-pink-200 dark:border-slate-800 aspect-[4/3] bg-pink-100">
              <img
                src="/images/pregnancy_care_photo.jpg"
                alt="Compassionate pregnancy care consultation"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 7: HEALTHCARE NETWORK & NEARBY FACILITIES ────────────── */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Healthcare near you
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Nearby Care Facilities and verified regional trauma centers in your active grid
            </p>
          </div>
          <button
            onClick={() => onNavigate('map')}
            className="px-5 py-2.5 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold flex items-center gap-2 cursor-pointer hover:bg-slate-800"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>VIEW HEALTHCARE MAP</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {nearbyHospitals.map((h) => (
            <div
              key={h.id}
              className="rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 flex items-center justify-center font-bold">
                    <Building className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                    {h.verification_status}
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {h.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {h.address}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400 font-medium">
                  {h.icu_beds_available} ICU Beds Available
                </span>
                <button
                  onClick={() => onNavigate('appointments')}
                  className="font-bold text-[#0F4C47] dark:text-[#E2F2A4] hover:underline cursor-pointer"
                >
                  Book Visit
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── SECTION 8: DONOR MODE SECTION ─────────────────────────────────── */}
      <section className="rounded-[32px] bg-gradient-to-r from-purple-900 to-indigo-950 text-white p-6 sm:p-10 shadow-lg relative overflow-hidden">
        <div className="max-w-2xl space-y-4 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-bold">
            <Heart className="w-3.5 h-3.5 text-purple-300" />
            <span>Universal Donor Network</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Your donation can help someone when it matters most.
          </h2>
          <p className="text-xs sm:text-sm text-purple-200 leading-relaxed">
            Every patient has the universal capability to register as a voluntary blood donor. Real-time emergency requests alert compatible donors nearby with 800m privacy jitter.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => onNavigate('donor')}
              className="px-7 py-3.5 rounded-full bg-white text-purple-950 font-extrabold text-xs sm:text-sm hover:bg-purple-50 transition-all cursor-pointer shadow-md"
            >
              OPEN DONOR MODE
            </button>
            <div className="text-xs text-purple-200 font-medium">
              Blood Group: <strong className="text-white font-bold">{bloodGroup}</strong> • Ready to respond
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 9: APPOINTMENTS & RECENT ACTIVITY ────────────────────── */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Your upcoming care
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Recent Activity and scheduled appointments with clinical specialists
            </p>
          </div>
          <button
            onClick={() => onNavigate('appointments')}
            className="text-xs font-bold text-[#0F4C47] dark:text-[#E2F2A4] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>VIEW ALL APPOINTMENTS</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {appointments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {appointments.map((app) => (
              <div
                key={app.id}
                className="rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {app.appointment_type.replace(/_/g, ' ')}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      {app.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {app.facility_name}
                  </h3>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{app.appointment_date} at {app.start_time}</span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-mono text-[11px]">{app.appointment_code}</span>
                  <span className="text-[#0F4C47] font-bold">Confirmed</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-8 text-center space-y-3">
            <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200">No upcoming appointments</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You currently have no scheduled hospital or specialist visits.
            </p>
            <button
              onClick={() => onNavigate('appointments')}
              className="px-6 py-2.5 rounded-full bg-[#0F4C47] text-white text-xs font-bold hover:bg-[#0A3834] transition-all cursor-pointer"
            >
              BOOK AN APPOINTMENT
            </button>
          </div>
        )}
      </section>

      {/* ─── SECTION 10: DOCTORS & SPECIALISTS SHOWCASE ───────────────────── */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-1.5">
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#E2F2A4] text-[#243E17] text-xs font-bold uppercase tracking-wider">
            <span>● Doctors</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Doctors &amp; Medical Specialists
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Accredited clinical specialists with extensive trauma and primary care experience
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {doctors.map((d) => (
            <div
              key={d.id}
              className="rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between text-center hover:shadow-md transition-shadow"
            >
              <div className="space-y-3">
                <div className="w-20 h-20 rounded-full mx-auto overflow-hidden ring-4 ring-slate-100 dark:ring-slate-800 shadow-sm bg-slate-100">
                  <img
                    src="/images/friendly_doctor_portrait.jpg"
                    alt={d.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EBF7D0] text-[#243E17]">
                    {d.specialty}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-2">
                    {d.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">{d.qualification}</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => onNavigate('appointments')}
                  className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-[#0F4C47] hover:text-white text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                >
                  Book Consultation
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── SECTION 11: PATIENT TESTIMONIAL / TRUST CARD ─────────────────── */}
      <section className="rounded-[32px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm shrink-0">
              ES
            </div>
            <div>
              <div className="flex items-center gap-1 text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-3.5 h-3.5 fill-amber-400" />
                ))}
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                Verified Patient Emergency Response
              </div>
              <p className="text-xs text-slate-500 max-w-xl mt-1">
                "When our mother required urgent cardiac triage, LifelineX coordinated an ALS ambulance within 4 minutes. Real-time telemetry gave our family complete peace of mind."
              </p>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 shrink-0">
            Verified Community Review
          </div>
        </div>
      </section>
    </div>
  );
};
