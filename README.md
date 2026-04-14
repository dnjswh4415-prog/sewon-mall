#쇼핑몰 프로젝트 포트폴리오

## 1. 프로젝트 개요

### 프로젝트명
쇼핑몰 웹 애플리케이션 (Shopping Mall Web Application)

### 프로젝트 소개
본 프로젝트는 사용자 친화적인 쇼핑몰 서비스를 구현하기 위해 개발한 웹 애플리케이션입니다.  
프론트엔드는 Next.js, React, TypeScript를 기반으로 구성하였고, 백엔드는 NestJS와 MySQL, Prisma ORM을 활용하여 설계하였습니다.  

회원가입, 로그인, 마이페이지와 같은 사용자 기능을 중심으로 구현하였으며, JWT 기반 인증 방식을 적용해 사용자 정보를 안전하게 관리할 수 있도록 구성하였습니다. 또한 REST API 기반으로 프론트엔드와 백엔드를 연동하였고, Tailwind CSS를 활용하여 반응형 UI를 구현하였습니다.

---

## 2. 기술 스택

### Frontend
- React: 사용자 인터페이스 구성
- Next.js: 라우팅 및 프론트엔드 구조 설계
- TypeScript: 정적 타입 기반 개발
- Tailwind CSS: UI 스타일링 및 반응형 화면 구성

### Backend
- NestJS: 구조적인 서버 애플리케이션 개발
- Node.js: 서버 실행 환경
- TypeScript: 유지보수성과 안정성을 고려한 개발
- Swagger: API 문서 자동화

### Database
- MySQL: 관계형 데이터베이스
- Prisma ORM: 타입 안정성을 갖춘 ORM

### 인증 및 확장 계획
- JWT: 토큰 기반 인증 처리
- Redis: 세션 관리 및 캐시 처리 예정

### 배포 및 인프라 계획
- Docker: 컨테이너 기반 실행 환경 구성 예정
- AWS: 클라우드 서버 배포 예정
- Nginx: 리버스 프록시 및 서버 운영 예정

---

## 3. 주요 기능

- 이메일과 비밀번호를 이용한 회원가입 기능
- 로그인 시 JWT 발급 및 인증 처리
- 인증된 사용자만 접근 가능한 마이페이지 기능
- 이메일 중복 확인 API 제공
- Tailwind CSS 기반의 반응형 UI 구현
- React Client Component 방식의 사용자 화면 구성
