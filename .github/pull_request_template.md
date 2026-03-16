## Summary

<!-- 1-3 bullet points describing what this PR does -->

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Enhancement
- [ ] Refactoring
- [ ] Documentation
- [ ] Security fix

## Security Checklist (SECURITY-RULEBOOK M.7)

- [ ] No hardcoded secrets, tokens, or API keys
- [ ] Input validation added/updated (Zod schemas)
- [ ] RBAC permissions verified for new/changed endpoints
- [ ] Tenant isolation confirmed (property_id scoping)
- [ ] PII handling follows sanitization rules
- [ ] No PII in logs or URL parameters
- [ ] SQL injection prevented (parameterized queries)
- [ ] XSS prevented (output encoding, DOMPurify)
- [ ] CSRF protection in place
- [ ] Rate limiting configured for new endpoints

## Accessibility Checklist

- [ ] ARIA labels on interactive elements
- [ ] Keyboard navigation tested
- [ ] Screen reader tested
- [ ] Color contrast meets WCAG 2.2 AA

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed
- [ ] Coverage threshold maintained (≥95%)

## Test Plan

<!-- How to test this change -->
