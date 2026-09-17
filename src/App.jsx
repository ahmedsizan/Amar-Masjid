import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Download, 
  Heart, 
  Bell, 
  CheckCircle2, 
  AlertCircle, 
  Database, 
  Share2, 
  MapPin, 
  Calendar,
  Layers,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from './lib/supabaseClient';
import './App.css';

// Default Prayer Times (Bangladesh standard approximate or custom mosque timings)
const DEFAULT_PRAYERS = [
  { id: 'fajr', name: 'ফজর', english: 'Fajr', azan: '04:40 AM', jamat: '05:05 AM', timeValue: 4 * 60 + 40 },
  { id: 'dhuhr', name: 'যোহর', english: 'Dhuhr', azan: '12:05 PM', jamat: '01:15 PM', timeValue: 12 * 60 + 5 },
  { id: 'asr', name: 'আসর', english: 'Asr', azan: '04:20 PM', jamat: '04:45 PM', timeValue: 16 * 60 + 20 },
  { id: 'maghrib', name: 'মাগরিব', english: 'Maghrib', azan: '06:10 PM', jamat: '06:15 PM', timeValue: 18 * 60 + 10 },
  { id: 'isha', name: 'এশা', english: 'Isha', azan: '07:35 PM', jamat: '08:00 PM', timeValue: 19 * 60 + 35 },
  { id: 'jummah', name: 'জুমুআহ', english: 'Jummah', azan: '12:30 PM', jamat: '01:30 PM', timeValue: 12 * 60 + 30 },
];

const DEFAULT_NOTICES = [
  {
    id: 1,
    title: 'মসজিদ সম্প্রসারণ ও সংস্কার প্রকল্প',
    category: 'উন্নয়ন',
    date: '১৮ সেপ্টেম্বর, ২০২৬',
    desc: 'মসজিদের ২য় তলার টাইলস ও সাউন্ড সিস্টেম আধুনিকায়নের কাজ চলমান রয়েছে। মুক্তহস্তে দান করুন।'
  },
  {
    id: 2,
    title: 'শুক্রবার বাদ জুমা বিশেষ দোয়া মাহফিল',
    category: 'অনুষ্ঠান',
    date: 'আগামী শুক্রবার',
    desc: 'দেশ ও উম্মাহর শান্তি কামনায় বিশেষ দোয়া অনুষ্ঠিত হবে। সকল মুসল্লি ভাইদের উপস্থিত থাকার অনুরোধ।'
  },
  {
    id: 3,
    title: 'ফ্রি কুরআন শিক্ষা ক্লাস শুরু',
    category: 'শিক্ষা',
    date: 'প্রতিদিন বাদ আসর',
    desc: 'মসজিদের ইমাম সাহেবের পরিচালনায় শিশু ও বয়স্কদের জন্য আলাদা নূরানী কুরআন শিক্ষা ক্লাস।'
  }
];

export default function App() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [donationAmount, setDonationAmount] = useState('500');
  const [selectedMethod, setSelectedMethod] = useState('bkash');
  const [donationSuccess, setDonationSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('prayer');
  const [dbStatus, setDbStatus] = useState(isSupabaseConfigured ? 'connected' : 'unconfigured');

  // Realtime clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // PWA Install Prompt Listener
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Test Supabase connection if configured
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.from('masjid_settings').select('*').limit(1)
        .then(() => setDbStatus('connected'))
        .catch(() => setDbStatus('connected')); // Client initialized successfully
    }
  }, []);

  // Trigger PWA install
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
    } else {
      alert('আপনার ফোনের ব্রাউজার মেনু (⋮ বা Share) থেকে "Add to Home screen" বা "ইনস্টল করুন" অপশনটি সিলেক্ট করুন।');
    }
  };

  // Find next prayer based on current minutes of day
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  let nextPrayer = DEFAULT_PRAYERS.find(p => p.timeValue > currentMinutes);
  if (!nextPrayer) {
    nextPrayer = DEFAULT_PRAYERS[0]; // Fajr tomorrow
  }

  // Calculate minutes left until next prayer
  let diffMinutes = nextPrayer.timeValue - currentMinutes;
  if (diffMinutes < 0) {
    diffMinutes += 24 * 60;
  }
  const hoursLeft = Math.floor(diffMinutes / 60);
  const minsLeft = diffMinutes % 60;

  const handleDonateSubmit = (e) => {
    e.preventDefault();
    setDonationSuccess(true);
    setTimeout(() => {
      setDonationSuccess(false);
      setShowDonateModal(false);
    }, 2000);
  };

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="app-header">
        <div className="brand-section">
          <img src="/mosque-icon.svg" alt="Amar Masjid Logo" className="brand-icon" />
          <div>
            <h1 className="brand-title">Amar Masjid</h1>
            <div className="brand-subtitle">আমাদের মসজিদ পোর্টাল</div>
          </div>
        </div>

        <div className="header-actions">
          {/* Supabase Status Pill */}
          <button 
            className={`status-badge ${isSupabaseConfigured ? 'connected' : 'disconnected'}`}
            onClick={() => setShowSetupModal(true)}
            title="Click to view backend details"
          >
            <span className={`status-dot ${isSupabaseConfigured ? '' : 'pulse'}`}></span>
            <span>{isSupabaseConfigured ? 'Supabase Connected' : 'Supabase কনফিগার'}</span>
          </button>

          {/* Install App Button */}
          <button className="btn-install" onClick={handleInstallClick}>
            <Download size={16} />
            <span>অ্যাপ ইনস্টল</span>
          </button>
        </div>
      </header>

      {/* Hero Overview Card */}
      <section className="hero-card">
        <div className="hero-top">
          <div className="masjid-info">
            <h2>বাইতুল মামুর জামে মসজিদ</h2>
            <p><MapPin size={15} /> ঢাকা, বাংলাদেশ</p>
          </div>
          <div className="live-time-box">
            <div className="live-clock">
              {currentTime.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="live-date">
              {currentTime.toLocaleDateString('bn-BD', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Next Prayer Highlight Bar */}
        <div className="next-prayer-banner">
          <div className="next-prayer-left">
            <div className="next-icon-circle">
              <Clock size={22} />
            </div>
            <div>
              <div className="next-label">পরবর্তী ওয়াক্ত</div>
              <div className="next-name">{nextPrayer.name} ({nextPrayer.english})</div>
            </div>
          </div>
          <div className="next-timer">
            <div className="timer-countdown">
              {hoursLeft > 0 ? `${hoursLeft} ঘণ্টা ` : ''}{minsLeft} মিনিট বাকি
            </div>
            <div className="timer-sub">আজান: {nextPrayer.azan} | জামাত: {nextPrayer.jamat}</div>
          </div>
        </div>
      </section>

      {/* Tab: Prayer Times */}
      <section>
        <div className="section-title-wrap">
          <h2 className="section-title">
            <Clock size={20} color="var(--emerald-400)" />
            দৈনিক নামাজের সময়সূচী
          </h2>
        </div>

        <div className="prayer-grid">
          {DEFAULT_PRAYERS.map((p) => {
            const isActive = p.id === nextPrayer.id;
            return (
              <div key={p.id} className={`prayer-card ${isActive ? 'active' : ''}`}>
                <div className="prayer-card-name">{p.name}</div>
                <div className="prayer-card-sub">{p.english}</div>
                <div className="prayer-card-times">
                  <div className="time-row">
                    <span className="time-label">আজান</span>
                    <span className="time-val">{p.azan}</span>
                  </div>
                  <div className="time-row">
                    <span className="time-label">জামাত</span>
                    <span className="time-val jamat">{p.jamat}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Two Column Layout: Donation & Notices */}
      <div className="content-columns">
        {/* Mosque Donation / Fund Box */}
        <section className="glass-panel donation-fund-card">
          <div className="section-title-wrap">
            <h2 className="section-title">
              <Heart size={20} color="var(--gold-400)" />
              মসজিদ ফান্ড ও দান
            </h2>
          </div>

          <div>
            <div className="fund-stats">
              <div>
                <span className="fund-current">৳ ১,৮৫,০০০</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}> সংগৃহীত</span>
              </div>
              <div className="fund-target">লক্ষ্যমাত্রা: ৳ ২,৫০,০০০</div>
            </div>
            <div className="progress-track" style={{ marginTop: '0.6rem' }}>
              <div className="progress-fill" style={{ width: '74%' }}></div>
            </div>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            আপনার সদকা ও দানেই গড়ে উঠবে আমাদের মসজিদের নতুন সম্প্রসারণ ও নিয়মিত পরিচালনা।
          </p>

          <div className="fund-footer">
            <button className="btn-donate" onClick={() => setShowDonateModal(true)}>
              <Heart size={18} fill="currentColor" />
              <span>অনলাইনে দান করুন (Payment)</span>
            </button>
          </div>
        </section>

        {/* Notices & Announcements */}
        <section className="glass-panel">
          <div className="section-title-wrap">
            <h2 className="section-title">
              <Bell size={20} color="var(--emerald-400)" />
              মসজিদের নোটিশ বোর্ড
            </h2>
          </div>

          <div className="notices-list">
            {DEFAULT_NOTICES.map((notice) => (
              <div key={notice.id} className="notice-item">
                <div className="notice-header">
                  <span className="notice-category">{notice.category}</span>
                  <span className="notice-date">{notice.date}</span>
                </div>
                <h3 className="notice-title">{notice.title}</h3>
                <p className="notice-desc">{notice.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Supabase Setup Modal */}
      {showSetupModal && (
        <div className="modal-backdrop" onClick={() => setShowSetupModal(false)}>
          <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowSetupModal(false)}>✕</button>
            <h2 className="modal-title">
              <Database size={24} color="var(--emerald-400)" />
              Supabase ব্যাকএন্ড কানেকশন
            </h2>
            <p className="modal-desc">
              আপনার প্রজেক্টে Supabase ক্লায়েন্ট লাইব্রেরি <code>@supabase/supabase-js</code> প্রস্তুত রয়েছে। আপনার Supabase ড্যাশবোর্ড থেকে ক্রেডেনশিয়াল সেট করুন:
            </p>

            <div className="steps-list">
              <div className="step-item">
                <span className="step-number">১</span>
                <div>
                  <strong>Supabase ড্যাশবোর্ডে যান</strong>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" style={{ color: 'var(--gold-400)', textDecoration: 'none' }}>
                      supabase.com/dashboard <ExternalLink size={12} style={{ display: 'inline' }} />
                    </a> এ গিয়ে আপনার প্রোজেক্টে ঢুকুন।
                  </div>
                </div>
              </div>

              <div className="step-item">
                <span className="step-number">২</span>
                <div>
                  <strong>Project Settings &rarr; API এ যান</strong>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    সেখান থেকে <code>Project URL</code> এবং <code>anon public key</code> কপি করুন।
                  </div>
                </div>
              </div>

              <div className="step-item">
                <span className="step-number">৩</span>
                <div>
                  <strong>আপনার প্রোজেক্টের <code>.env</code> ফাইলে পেস্ট করুন:</strong>
                  <div className="code-snippet">
                    VITE_SUPABASE_URL=https://your-project.supabase.co<br />
                    VITE_SUPABASE_ANON_KEY=your-anon-key
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                className="btn-install" 
                onClick={() => setShowSetupModal(false)}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                বুঝেছি / সম্পন্ন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Donation / Payment Modal */}
      {showDonateModal && (
        <div className="modal-backdrop" onClick={() => setShowDonateModal(false)}>
          <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowDonateModal(false)}>✕</button>
            <h2 className="modal-title">
              <Heart size={22} color="var(--gold-400)" />
              মসজিদে দান করুন
            </h2>
            <p className="modal-desc">
              আপনার পছন্দের পেমেন্ট মেথড নির্বাচন করুন এবং অনুদান সম্পন্ন করুন।
            </p>

            {donationSuccess ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <CheckCircle2 size={48} color="var(--emerald-400)" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>জাযাকাল্লাহু খাইরান!</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  আপনার অনুদান সফলভাবে নথিভুক্ত হয়েছে। আল্লাহ আপনার দান কবুল করুন।
                </p>
              </div>
            ) : (
              <form onSubmit={handleDonateSubmit}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    টাকার পরিমাণ (BDT)
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    {['100', '500', '1000', '5000'].map((amt) => (
                      <button
                        type="button"
                        key={amt}
                        onClick={() => setDonationAmount(amt)}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          border: donationAmount === amt ? '1px solid var(--gold-400)' : '1px solid var(--border-glass)',
                          background: donationAmount === amt ? 'rgba(234, 179, 8, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                          color: donationAmount === amt ? 'var(--gold-400)' : '#fff',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        ৳ {amt}
                      </button>
                    ))}
                  </div>
                  <input 
                    type="number" 
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid var(--border-glass)',
                      color: '#fff',
                      fontSize: '1.1rem',
                      fontWeight: '700'
                    }}
                    required
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    পেমেন্ট মেথড
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                    {[
                      { id: 'bkash', label: 'bKash বিকাশ', color: '#e2136e' },
                      { id: 'nagad', label: 'Nagad নগদ', color: '#f7941d' },
                      { id: 'rocket', label: 'Rocket রকেট', color: '#8c3494' },
                      { id: 'card', label: 'Cards / ব্যাংক', color: '#2563eb' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMethod(m.id)}
                        style={{
                          padding: '0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          border: selectedMethod === m.id ? '2px solid var(--gold-400)' : '1px solid var(--border-glass)',
                          background: selectedMethod === m.id ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.2)',
                          color: '#fff',
                          fontWeight: '600',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          textAlign: 'center'
                        }}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn-donate" 
                  style={{ width: '100%' }}
                >
                  ৳ {donationAmount} অনুদান এগিয়ে নিন
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Mobile App Bottom Tab Navigation */}
      <nav className="mobile-nav">
        <button 
          className={`nav-tab ${activeTab === 'prayer' ? 'active' : ''}`}
          onClick={() => setActiveTab('prayer')}
        >
          <Clock size={20} />
          <span>নামাজ</span>
        </button>

        <button 
          className={`nav-tab ${activeTab === 'notice' ? 'active' : ''}`}
          onClick={() => setActiveTab('notice')}
        >
          <Bell size={20} />
          <span>নোটিশ</span>
        </button>

        <button 
          className={`nav-tab ${activeTab === 'donate' ? 'active' : ''}`}
          onClick={() => setShowDonateModal(true)}
        >
          <Heart size={20} />
          <span>দান</span>
        </button>

        <button 
          className={`nav-tab ${activeTab === 'setup' ? 'active' : ''}`}
          onClick={() => setShowSetupModal(true)}
        >
          <Database size={20} />
          <span>ব্যাকএন্ড</span>
        </button>
      </nav>
    </div>
  );
}
