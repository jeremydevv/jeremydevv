import { pathToFileURL } from 'node:url';

export function validateProtection(environment, branches) {
  const reviewers = environment.protection_rules?.find((rule) => rule.type === 'required_reviewers');
  if (environment.can_admins_bypass !== false ||
      !reviewers?.reviewers?.some((entry) => entry.type === 'User' && entry.reviewer?.id === 194394267) ||
      environment.deployment_branch_policy?.custom_branch_policies !== true ||
      environment.deployment_branch_policy?.protected_branches !== false ||
      branches.length !== 1 || branches[0].name !== 'main' || branches[0].type !== 'branch') {
    throw new Error('Production environment approval or main-only branch protection is not configured as required');
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const headers = { 'Accept': 'application/vnd.github+json', 'User-Agent': 'portfolio-production-gate' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const endpoint = 'https://api.github.com/repos/jeremydevv/jeremydevv/environments/production';
  async function get(url) {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`GitHub environment verification failed: ${response.status}`);
    return response.json();
  }
  const [environment, branches] = await Promise.all([get(endpoint), get(`${endpoint}/deployment-branch-policies`)]);
  validateProtection(environment, branches.branch_policies);
  console.log('Production environment requires owner approval and allows only main.');
}
