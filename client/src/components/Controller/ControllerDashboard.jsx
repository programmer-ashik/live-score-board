import React, { useState } from "react";
import { useScoreboard } from "../../context/ScoreboardContext";
import ScoringPanel from "./ScoringPanel";
import PlayerControls from "./PlayerControls";
import GraphicsPanel from "./GraphicsPanel";
import SquadManager from "./SquadManager";
import WicketModal from "./WicketModal";
import Button from "../Common/Button";

const TABS = ["scoring", "squad", "graphics"];

export default function ControllerDashboard() {
  const [activeTab, setActiveTab] = useState("scoring");
  const [showWicketModal, setShowWicketModal] = useState(false);
  const { state, resetMatch } = useScoreboard();

  const handleLaunchOBS = () => {
    const url = `${window.location.origin}${window.location.pathname}#overlay`;
    window.open(url, "_blank", "width=1920,height=1080");
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}#overlay`;
    navigator.clipboard.writeText(url);
    alert("OBS URL copied to clipboard!");
  };

  return (
    <div className='min-h-screen bg-slate-950'>
      {/* Header */}
      <header className='sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800'>
        <div className='px-6 py-4 flex items-center justify-between flex-wrap gap-4'>
          <div className='flex items-center space-x-3'>
            <div className='w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-500 flex items-center justify-center'>
              <i className='fa-solid fa-tv text-white text-xl'></i>
            </div>
            <div>
              <h1 className='font-bold text-lg'>
                Cricket Scoreboard Controller
              </h1>
              <div className='flex items-center space-x-2'>
                <span className='w-2 h-2 rounded-full bg-emerald-400 animate-pulse'></span>
                <span className='text-xs text-emerald-400'>
                  Live Sync Active
                </span>
              </div>
            </div>
          </div>

          <div className='flex items-center space-x-3'>
            <Button onClick={handleLaunchOBS} variant='primary' size='sm'>
              <i className='fa-solid fa-tower-broadcast mr-2'></i> Launch OBS
              View
            </Button>
            <Button onClick={handleCopyLink} variant='secondary' size='sm'>
              <i className='fa-regular fa-copy mr-2'></i> Copy URL
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className='px-6 pb-3 flex space-x-2'>
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === tab
                  ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className='p-6'>
        {activeTab === "scoring" && (
          <div className='grid grid-cols-1 xl:grid-cols-12 gap-6'>
            <div className='xl:col-span-8 space-y-6'>
              <ScoringPanel onWicket={() => setShowWicketModal(true)} />
              <PlayerControls />
            </div>
            <div className='xl:col-span-4 space-y-6'>
              <GraphicsPanel />
              <div className='glass-panel p-5 space-y-3'>
                <h3 className='font-bold text-sm text-slate-300'>
                  Match Actions
                </h3>
                <Button onClick={resetMatch} variant='danger' fullWidth>
                  <i className='fa-solid fa-arrow-rotate-left mr-2'></i> Reset
                  Match
                </Button>
                <div className='text-center text-xs text-slate-500'>
                  <div className='break-all font-mono text-cyan-400 text-[10px]'>
                    {window.location.origin}
                    {window.location.pathname}#overlay
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "squad" && <SquadManager />}

        {activeTab === "graphics" && (
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <GraphicsPanel expanded />
            <div className='glass-panel p-5'>
              <h3 className='font-bold mb-3'>Match Metadata</h3>
              <div className='space-y-3'>
                <div>
                  <label className='text-xs text-slate-400 block mb-1'>
                    League / Series
                  </label>
                  <input
                    type='text'
                    value={state.leagueName}
                    onChange={(e) =>
                      useScoreboard().updateSettings({
                        leagueName: e.target.value,
                      })
                    }
                    className='w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm'
                  />
                </div>
                <div>
                  <label className='text-xs text-slate-400 block mb-1'>
                    Venue
                  </label>
                  <input
                    type='text'
                    value={state.venue}
                    onChange={(e) =>
                      useScoreboard().updateSettings({ venue: e.target.value })
                    }
                    className='w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm'
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Wicket Modal */}
      <WicketModal
        isOpen={showWicketModal}
        onClose={() => setShowWicketModal(false)}
      />
    </div>
  );
}
