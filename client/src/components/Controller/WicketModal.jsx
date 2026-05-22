import { useState, useEffect } from "react";
import { useScoreboard } from "../../context/ScoreboardContext";
import { getBattingSquad } from "../../utils/helpers";

export default function WicketModal({ isOpen, onClose }) {
  const { state, registerWicket } = useScoreboard();
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [dismissalType, setDismissalType] = useState("Bowled");
  const [selectedIncoming, setSelectedIncoming] = useState("");

  const battingSquad = getBattingSquad(state);
  const activeBatsmen = battingSquad.filter((p) => !p.isOut && p.hasBatted);
  const availableBatsmen = battingSquad.filter((p) => !p.hasBatted);

  useEffect(() => {
    if (activeBatsmen.length > 0) {
      setSelectedPlayer(activeBatsmen[0].id.toString());
    }
    if (availableBatsmen.length > 0) {
      setSelectedIncoming(availableBatsmen[0].id.toString());
    }
  }, [isOpen, state.score.wickets]);

  const handleConfirm = () => {
    if (selectedPlayer && selectedIncoming) {
      registerWicket(
        parseInt(selectedPlayer),
        dismissalType,
        parseInt(selectedIncoming),
      );
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4'>
      <div className='glass-panel w-full max-w-md p-6 rounded-2xl'>
        <h3 className='text-xl font-bold text-red-500 mb-4'>
          Record Dismissal
        </h3>

        <div className='space-y-4'>
          <div>
            <label className='text-xs text-slate-400 block mb-1'>
              Outgoing Batsman
            </label>
            <select
              value={selectedPlayer}
              onChange={(e) => setSelectedPlayer(e.target.value)}
              className='w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2'
            >
              {activeBatsmen.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.runs} off {p.balls})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className='text-xs text-slate-400 block mb-1'>
              Dismissal Type
            </label>
            <select
              value={dismissalType}
              onChange={(e) => setDismissalType(e.target.value)}
              className='w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2'
            >
              <option>Bowled</option>
              <option>Caught</option>
              <option>LBW</option>
              <option>Run Out</option>
              <option>Stumped</option>
              <option>Hit Wicket</option>
            </select>
          </div>

          <div>
            <label className='text-xs text-slate-400 block mb-1'>
              Incoming Batsman
            </label>
            <select
              value={selectedIncoming}
              onChange={(e) => setSelectedIncoming(e.target.value)}
              className='w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2'
            >
              {availableBatsmen.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className='flex gap-3 mt-6'>
          <button
            onClick={handleConfirm}
            className='flex-1 bg-red-600 hover:bg-red-500 py-2 rounded-lg font-bold transition-all'
          >
            Confirm Dismissal
          </button>
          <button
            onClick={onClose}
            className='flex-1 bg-slate-700 hover:bg-slate-600 py-2 rounded-lg font-bold transition-all'
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
