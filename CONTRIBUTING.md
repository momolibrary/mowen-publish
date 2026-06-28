# 贡献指南

## 分支管理

```
main (保护分支)
  └── dev (开发主线)
       ├── feature/2-project-skeleton
       ├── feature/3-ci-cd
       ├── feature/5-markdown-to-noteatom
       └── ...
```

- `main`: 生产分支，只接受 `dev` 合并
- `dev`: 开发主线，所有 feature 分支合并到这里
- `feature/{issue}-{name}`: 功能分支，一个 issue 一个分支

## Issue 开发流程（E2E 循环）

每个 Issue 严格按以下流程执行：

```
1. PM 设计     → 明确验收标准
2. 创建分支    → git checkout -b feature/{issue}-{name} dev
3. 开发        → 编写代码 + 测试
4. 测试        → npm run test 全绿
5. 代码审核    → 自审或人工审核
6. 修改        → 根据审核意见修改
7. 合码        → PR 合并到 dev
8. 推送        → git push origin dev
9. 关 Issue    → gh issue close {number}
10. 干净退出   → 删除 feature 分支
```

## 命名规范

- 分支: `feature/{issue-number}-{short-name}`
- 提交: `feat(scope): description` 或 `fix(scope): description`
- PR: `[{Issue}] Title`

## 提交规范

```
feat(core): implement markdown to noteatom converter
fix(api): handle 429 rate limit error
test(markdown): add test seeds for link parsing
docs(readme): add installation instructions
chore(ci): update node version matrix
```

## 测试要求

- 单元测试: 核心模块必须有测试
- 测试种子: 使用 fixtures 目录的测试数据
- Mock: API 调用必须 mock，不依赖真实服务
- CI 全绿: 合码前必须通过 CI

## 代码审核清单

- [ ] 代码风格符合 ESLint 规则
- [ ] 有对应的单元测试
- [ ] 测试种子在 fixtures 目录
- [ ] 没有硬编码的 API Key
- [ ] 错误处理完整
- [ ] 日志输出清晰
