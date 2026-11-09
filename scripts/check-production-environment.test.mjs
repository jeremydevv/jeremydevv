import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateProtection } from './check-production-environment.mjs';

const environment = {can_admins_bypass: false, deployment_branch_policy: {custom_branch_policies: true, protected_branches: false}, protection_rules: [{type: 'required_reviewers', reviewers: [{type: 'User', reviewer: {id: 194394267}}]}]};
const branches = [{name: 'main', type: 'branch'}];
test('production protection fails closed on missing approval, bypass, or broader branches', () => {
  assert.doesNotThrow(() => validateProtection(environment, branches));
  assert.throws(() => validateProtection({...environment, protection_rules: []}, branches));
  assert.throws(() => validateProtection({...environment, can_admins_bypass: true}, branches));
  assert.throws(() => validateProtection(environment, [...branches, {name: '*', type: 'branch'}]));
});
