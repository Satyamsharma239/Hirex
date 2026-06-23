import axios from 'axios';

const API = axios.create({ baseURL: '/api', timeout: 120000 });

export const jobsAPI = {
  getAll:   ()        => API.get('/jobs'),
  getStats: ()        => API.get('/jobs/stats'),
  create:   (data)    => API.post('/jobs', data),
  update:   (id,data) => API.put(`/jobs/${id}`, data),
  delete:   (id)      => API.delete(`/jobs/${id}`),
};

export const aiAPI = {
  analyzeResume:             (fd) => API.post('/ai/analyze-resume', fd, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 }),
  generateCoverLetter:       (d)  => API.post('/ai/cover-letter', d),
  generateInterviewQuestions:(d)  => API.post('/ai/interview-questions', d),
  generateFollowupEmail:     (d)  => API.post('/ai/followup-email', d),
  getInsights:               (d)  => API.post('/ai/insights', d),
  getReadinessScore:         (d)  => API.post('/ai/readiness-score', d),
  getSalaryEstimate:         (d)  => API.post('/ai/salary-estimate', d),
};

export const discoverAPI = {
  searchJobs:      (d) => API.post('/discover/jobs', d),
  getCareerDNA:    (d) => API.post('/discover/career-dna', d),
  getRoleJobs:     (d) => API.post('/discover/role-jobs', d),
  getCompanyIntel: (d) => API.post('/discover/company-intel', d),
  getOutreachEmail:(d) => API.post('/discover/outreach-email', d),
  getATSAudit:     (d) => API.post('/discover/ats-audit', d),
};

export const featuresAPI = {
  getGhostRate:        (d) => API.post('/features/ghost-rate', d),
  getFollowupSequence: (d) => API.post('/features/followup-sequence', d),
  startInterviewSim:   (d) => API.post('/features/interview-sim', d),
  scoreAnswer:         (d) => API.post('/features/interview-sim', d),
  compareOffers:       (d) => API.post('/features/compare-offers', d),
  getCareerCard:       (d) => API.post('/features/career-card', d),
  scanATS:             (d) => API.post('/features/ats-scan', d),
  hackReferral:        (d) => API.post('/features/referral-hack', d),
  tailorResume:        (d) => API.post('/features/resume-tailor', d),
};

export const profileAPI = {
  createOrUpdate:      (d) => API.post('/profile', d),
  getByUsername:       (u) => API.get(`/profile/${u}`),
};

export default API;
