import { psychologyCorpus } from '../data/corpus';

export default function PsychologyCorpusView() {
  return (
    <>
      <header className="mb-8 bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
        <h2 className="text-2xl font-bold tracking-tight mb-2">Psychology Corpus</h2>
        <p className="text-white/60 max-w-2xl text-sm leading-relaxed">
          The AI Brain's foundational understanding of cognitive psychology, behavioral economics, and motivation theory.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {psychologyCorpus.map((item) => (
          <div key={item.id} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] font-semibold tracking-widest text-indigo-400 mb-1 block uppercase">{item.category}</span>
                <h3 className="text-lg font-bold text-white/90 leading-tight">{item.concept}</h3>
              </div>
              <span className={`text-[10px] px-2 py-1 rounded border uppercase tracking-wider font-semibold ${
                item.ethicalRating === 'High' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                item.ethicalRating === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                'bg-green-500/10 text-green-400 border-green-500/30'
              }`}>
                Risk: {item.ethicalRating}
              </span>
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <h4 className="text-[11px] text-white/40 font-bold mb-1 uppercase tracking-wide">Mechanism</h4>
                <p className="text-sm text-white/80 leading-relaxed">{item.mechanism}</p>
              </div>
              <div>
                <h4 className="text-[11px] text-white/40 font-bold mb-1 uppercase tracking-wide">Game Applications</h4>
                <ul className="flex flex-wrap gap-2 mt-2">
                  {item.gameApplications.map((app, idx) => (
                    <li key={idx} className="text-xs bg-white/10 text-white/70 px-2 py-1 rounded-md border border-white/5">{app}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-[11px] text-white/40 font-bold mb-1 uppercase tracking-wide">Risk Assessment</h4>
                <p className="text-sm text-white/70">{item.risk}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
