// Chat window scaffolding (no outer demo UI)

function TeamsChatMock({ title = 'Teams Chat', children }) {
  return (
    <div className="bg-professional-gray-50 p-4">
      <div className="w-full max-w-[520px] mx-auto rounded-xl border border-professional-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-3 py-2 bg-professional-gray-100 border-b border-professional-gray-200">
          <div className="text-xs font-semibold text-professional-gray-800">{title}</div>
        </div>
        <div className="p-3 bg-professional-gray-50">
          <div className="space-y-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatMessage({ from = 'bot', children }) {
  return (
    <div className="flex items-start gap-2">
      <div className="w-7 h-7 rounded-full bg-professional-gray-300 flex-shrink-0" aria-hidden="true"></div>
      <div className="max-w-[480px]">
        {children}
      </div>
    </div>
  );
}

export default function AdaptiveCardsLab() {
  // Only chat-style previews below

  const schedulingPreview = (
    <TeamsChatMock title="Chat with Dreamspace App">
      <ChatMessage>
        <div className="rounded-lg border border-professional-gray-200 bg-white">
          <div className="px-3 py-2 bg-professional-gray-50 border-b border-professional-gray-200">
            <div className="text-xs font-semibold text-professional-gray-900">Teams Adaptive Card</div>
            <div className="text-[11px] text-professional-gray-600">Connect Scheduling</div>
          </div>
          <div className="p-3 space-y-2.5">
            <div>
              <div className="text-sm font-semibold text-[#ED1C24]">Suggest a time to connect</div>
              <p className="text-[13px] text-professional-gray-700">User A proposed windows. Pick one or suggest another.</p>
            </div>
            <fieldset className="space-y-1.5">
              {['Tue 10:00-12:00','Wed 14:00-16:00','Thu 09:00-11:00'].map((label) => (
                <label key={label} className="flex items-center gap-2 text-[13px]">
                  <input name="slot" type="radio" className="accent-[#ED1C24]" />
                  <span>{label}</span>
                </label>
              ))}
            </fieldset>
            <div className="pt-1.5">
              <div className="text-[13px] font-semibold text-professional-gray-900">Or suggest another slot</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1.5">
                <input type="date" className="input-field !py-1.5 !text-sm" />
                <input type="time" className="input-field !py-1.5 !text-sm" />
                <input type="time" className="input-field !py-1.5 !text-sm" />
              </div>
            </div>
            <div className="flex gap-2 pt-1.5">
              <button className="btn-primary !py-1.5 !px-3 !text-sm">Confirm</button>
              <button className="btn-secondary !py-1.5 !px-3 !text-sm">Suggest Another</button>
            </div>
          </div>
        </div>
      </ChatMessage>
    </TeamsChatMock>
  );


  const checkinPreview = (
    <TeamsChatMock title="Chat with Dreamspace App">
      <ChatMessage>
        <div className="rounded-lg border border-professional-gray-200 bg-white">
          <div className="px-3 py-2 bg-professional-gray-50 border-b border-professional-gray-200">
            <div className="text-xs font-semibold text-professional-gray-900">Teams Adaptive Card</div>
            <div className="text-[11px] text-professional-gray-600">Weekly Check-in</div>
          </div>
          <div className="p-3 space-y-2.5">
            <div className="text-sm font-semibold text-[#ED1C24]">Weekly Check-in</div>
            <input placeholder="Biggest win this week" className="input-field !py-1.5 !text-sm" />
            <input placeholder="Biggest challenge" className="input-field !py-1.5 !text-sm" />
            <label className="flex items-center gap-2 text-[13px]">
              <input type="checkbox" className="accent-[#ED1C24]" />
              <span>I stayed focused on my goals</span>
            </label>
            <label className="flex items-center gap-2 text-[13px]">
              <input type="checkbox" className="accent-[#ED1C24]" />
              <span>I need help</span>
            </label>
            <button className="btn-primary !py-1.5 !px-3 !text-sm">Submit</button>
          </div>
        </div>
      </ChatMessage>
    </TeamsChatMock>
  );


  const quickActionPreview = (
    <TeamsChatMock title="Chat with Dreamspace App">
      <ChatMessage>
        <div className="rounded-lg border border-professional-gray-200 bg-white">
          <div className="px-3 py-2 bg-professional-gray-50 border-b border-professional-gray-200">
            <div className="text-xs font-semibold text-professional-gray-900">Teams Adaptive Card</div>
            <div className="text-[11px] text-professional-gray-600">Quick Action</div>
          </div>
          <div className="p-3 space-y-2.5">
            <div className="text-sm font-semibold text-[#ED1C24]">Quick Actions</div>
            <p className="text-[13px] text-professional-gray-700">Mark goal complete or view details</p>
            <div className="flex gap-2">
              <button className="btn-primary !py-1.5 !px-3 !text-sm">Mark Complete</button>
              <button className="btn-secondary !py-1.5 !px-3 !text-sm">Open Details</button>
            </div>
          </div>
        </div>
      </ChatMessage>
    </TeamsChatMock>
  );

  return (
    <div className="max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-12 xl:px-16 py-6 space-y-6">
      {schedulingPreview}
      {checkinPreview}
      {quickActionPreview}
    </div>
  );
}


