/**
 * Weekly Check-in Adaptive Card
 * Matches the design in src/pages/labs/AdaptiveCards.jsx
 */
function getWeeklyCheckinCard() {
  return {
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    type: "AdaptiveCard",
    version: "1.5",
    body: [
      {
        type: "TextBlock",
        text: "Weekly Check-in",
        size: "Medium",
        weight: "Bolder",
        color: "Accent"
      },
      {
        type: "TextBlock",
        text: "Share your progress and challenges from this week",
        wrap: true,
        spacing: "Small",
        isSubtle: true
      },
      {
        type: "Input.Text",
        id: "win",
        placeholder: "Biggest win this week",
        isMultiline: false,
        spacing: "Medium"
      },
      {
        type: "Input.Text",
        id: "challenge",
        placeholder: "Biggest challenge",
        isMultiline: false,
        spacing: "Small"
      },
      {
        type: "Input.Toggle",
        id: "focused",
        title: "I stayed focused on my goals",
        valueOn: "true",
        valueOff: "false",
        value: "false",
        spacing: "Medium"
      },
      {
        type: "Input.Toggle",
        id: "needHelp",
        title: "I need help",
        valueOn: "true",
        valueOff: "false",
        value: "false",
        spacing: "Small"
      }
    ],
    actions: [
      {
        type: "Action.Submit",
        title: "Submit",
        data: {
          type: "checkin_submit"
        }
      }
    ]
  };
}

module.exports = {
  getWeeklyCheckinCard
};

