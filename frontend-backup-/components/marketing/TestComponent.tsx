'use client';

export function TestComponent() {
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold text-[--pp-text]">
        Marketing Token Test
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[--pp-card] border border-[--pp-border] rounded-lg p-4">
          <h3 className="text-lg font-semibold text-[--pp-text] mb-2">
            Card Background
          </h3>
          <p className="text-[--pp-muted]">
            This card uses <code className="bg-[--pp-bg] px-1 rounded">bg-[--pp-card]</code>
          </p>
        </div>
        
        <div className="bg-[--pp-bg] border border-[--pp-border] rounded-lg p-4">
          <h3 className="text-lg font-semibold text-[--pp-text] mb-2">
            Background Test
          </h3>
          <p className="text-[--pp-muted]">
            This uses <code className="bg-[--pp-card] px-1 rounded text-[--pp-text]">bg-[--pp-bg]</code>
          </p>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="text-[--pp-accent] font-medium">✓ Accent color (profit green)</div>
        <div className="text-[--pp-danger] font-medium">✓ Danger color (loss red)</div>
        <div className="text-[--pp-muted]">✓ Muted text color</div>
        <div className="text-[--pp-text]">✓ Primary text color</div>
      </div>
      
      <div className="bg-[--pp-card] border border-[--pp-border] rounded-lg p-4">
        <h3 className="text-lg font-semibold text-[--pp-text] mb-2">
          Border Test
        </h3>
        <p className="text-[--pp-muted]">
          This card has a border using <code className="bg-[--pp-bg] px-1 rounded text-[--pp-text]">border-[--pp-border]</code>
        </p>
      </div>
    </div>
  );
}
