쇼핑몰 프로젝트 포트폴리오 문서 (Markdown 템플릿)
🧾 프로젝트 개요
📌 프로젝트명

쇼핑몰 웹 애플리케이션 (Shopping Mall Web App)

📌 프로젝트 설명

React 기반으로 구성된 쇼핑몰 웹 애플리케이션입니다.
백엔드는 NestJS + MySQL(PRISMA) 기반으로 구성되었으며,
JWT 인증 및 이메일 중복 체크, REST API 기반 API 연동,
Responsive UI를 갖춘 로그인/회원가입/마이페이지 기능이 구현되었습니다.

🧩 기술 스택 (Tech Stack)
🏗️ Frontend
기술         설명
React	    UI 구성
Next.js	    서버 사이드/라우팅
TypeScript	정적 타입
TailwindCSS	CSS framework

⚙️ Backend
기술	    설명
NestJS	    MVC 중심 서버 프레임워크
Node.js	    JavaScript 런타임
TypeScript	정적 타입
Swagger	API 문서 자동 생성

🗄️ Database
기술	    설명
MySQL	    관계형 DB
Prisma ORM	Type-Safe ORM

🔐 인증/캐시
기술	    설명
JWT	Token   기반 인증
Redis (예정)	Session / Data cache

🚀 배포/인프라 (예정)
기술	    설명
Docker	    컨테이너 환경
AWS	        클라우드 호스팅
Nginx	    Reverse Proxy

🧠 요구사항 정리

✔ 이메일/비밀번호 기반 회원가입
✔ 로그인 후 JWT 발급
✔ Protected API 기반 내 정보 페이지
✔ 이메일 중복 체크 API
✔ TailwindCSS 기반 UI
✔ React “client” 방식 UI 컴포넌트