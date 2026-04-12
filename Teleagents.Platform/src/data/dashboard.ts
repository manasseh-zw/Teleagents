export type CallStatus = "completed" | "failed" | "voicemail" | "no-answer"
export type CallType = "inbound" | "outbound"

export interface RecentCall {
  id: string
  summary: string
  client: string
  clientAvatar: string
  type: CallType
  agent: string
  duration: string
  status: CallStatus
  date: string
  dateTimestamp: number
}

export interface AgentCallCount {
  name: string
  calls: number
  color: string
}

export const dashboardStats = {
  totalCalls: 847,
  avgDuration: "2:45",
  totalCost: "14K",
  totalCostUnit: "credits",
  avgCost: 698,
  avgCostUnit: "credits/call",
  totalLLMCost: "$0.112",
}

export const callVolumeData = [
  { month: "Jan", week: 1, calls: 82 },
  { month: "", week: 2, calls: 95 },
  { month: "", week: 3, calls: 110 },
  { month: "", week: 4, calls: 140 },
  { month: "Feb", week: 5, calls: 125 },
  { month: "", week: 6, calls: 118 },
  { month: "", week: 7, calls: 98 },
  { month: "", week: 8, calls: 104 },
  { month: "Mar", week: 9, calls: 88 },
  { month: "", week: 10, calls: 96 },
  { month: "", week: 11, calls: 115 },
  { month: "", week: 12, calls: 130 },
  { month: "Apr", week: 13, calls: 158 },
  { month: "", week: 14, calls: 172 },
  { month: "", week: 15, calls: 165 },
  { month: "", week: 16, calls: 148 },
  { month: "May", week: 17, calls: 175 },
  { month: "", week: 18, calls: 190 },
  { month: "", week: 19, calls: 185 },
  { month: "", week: 20, calls: 168 },
  { month: "Jun", week: 21, calls: 195 },
  { month: "", week: 22, calls: 210 },
  { month: "", week: 23, calls: 198 },
  { month: "", week: 24, calls: 205 },
  { month: "Jul", week: 25, calls: 188 },
  { month: "", week: 26, calls: 175 },
  { month: "", week: 27, calls: 192 },
  { month: "", week: 28, calls: 182 },
  { month: "Aug", week: 29, calls: 145 },
  { month: "", week: 30, calls: 162 },
  { month: "", week: 31, calls: 178 },
  { month: "", week: 32, calls: 195 },
  { month: "Sep", week: 33, calls: 172 },
  { month: "", week: 34, calls: 185 },
  { month: "", week: 35, calls: 168 },
  { month: "", week: 36, calls: 180 },
  { month: "Oct", week: 37, calls: 175 },
  { month: "", week: 38, calls: 188 },
  { month: "", week: 39, calls: 182 },
  { month: "", week: 40, calls: 196 },
]

export const mostCalledAgents: AgentCallCount[] = [
  { name: "Survey Caller", calls: 312, color: "#b8c9b0" },
  { name: "Support Agent", calls: 243, color: "#d4b0a3" },
  { name: "Sales Assistant", calls: 156, color: "#d9cfae" },
  { name: "Appointment Bot", calls: 89, color: "#6f7359" },
  { name: "Lead Qualifier", calls: 47, color: "#b88878" },
]

const agents = ["Survey Caller", "Support Agent", "Sales Assistant", "Appointment Bot", "Lead Qualifier"]
const clients = [
  { name: "John Smith", initials: "JS" },
  { name: "Emily Davis", initials: "ED" },
  { name: "Michael Brown", initials: "MB" },
  { name: "Sarah Wilson", initials: "SW" },
  { name: "Robert Garcia", initials: "RG" },
  { name: "Olivia Martinez", initials: "OM" },
  { name: "James Taylor", initials: "JT" },
  { name: "Sophia Anderson", initials: "SA" },
  { name: "William Thomas", initials: "WT" },
  { name: "Isabella Jackson", initials: "IJ" },
  { name: "Daniel White", initials: "DW" },
  { name: "Charlotte Harris", initials: "CH" },
]
const statuses: CallStatus[] = ["completed", "completed", "completed", "failed", "voicemail", "no-answer"]
const types: CallType[] = ["inbound", "outbound", "inbound", "outbound", "inbound", "outbound"]
const durations = ["4:22", "1:15", "7:48", "0:32", "3:55", "2:10", "6:14", "1:58", "5:03", "0:45"]

const callSummaries = [
  "Confirmed appointment for next Tuesday morning",
  "Customer requested callback about billing question",
  "Completed satisfaction survey, positive feedback overall",
  "Transferred to human agent after escalation",
  "Left voicemail with order confirmation details",
  "No pickup after ring timeout",
  "Qualified lead, interested in enterprise tier pricing and onboarding timeline",
  "Resolved password reset and verified account security",
  "Scheduled demo call and sent calendar invite link",
  "Caller hung up during hold music",
  "Captured callback number and preferred contact window",
  "Discussed refund policy and issued case reference number",
]

function getDateString(daysAgo: number): string {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  return `${months[date.getMonth()]} ${date.getDate().toString().padStart(2, "0")}, ${date.getFullYear()}`
}

export const recentCalls: RecentCall[] = Array.from({ length: 40 }, (_, i) => {
  const client = clients[i % clients.length]
  return {
    id: (i + 1).toString(),
    summary: callSummaries[i % callSummaries.length],
    client: client.name,
    clientAvatar: `https://api.dicebear.com/9.x/glass/svg?seed=${client.name.replace(" ", "")}`,
    type: types[i % types.length],
    agent: agents[i % agents.length],
    duration: durations[i % durations.length],
    status: statuses[i % statuses.length],
    date: getDateString(i % 30),
    dateTimestamp: Date.now() - i * 86400000,
  }
})
