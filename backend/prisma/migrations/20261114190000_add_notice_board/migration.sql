CREATE TABLE `Notice` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(200) NOT NULL,
    `content` TEXT NOT NULL,
    `category` VARCHAR(30) NOT NULL DEFAULT '공지사항',
    `isPinned` BOOLEAN NOT NULL DEFAULT false,
    `isPublished` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `Notice_isPublished_isPinned_createdAt_idx` (`isPublished`, `isPinned`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `Notice` (`title`, `content`, `category`, `isPinned`, `isPublished`)
VALUES
('[필독] SEWON-MALL은 개발 및 학습을 위한 시연 사이트입니다',
'안녕하세요. SEWON-MALL입니다.\n\n본 사이트는 전자상거래 서비스의 개발 및 학습을 위해 제작한 포트폴리오용 쇼핑몰입니다.\n\n화면에 표시되는 상품, 가격, 주문 및 결제 과정은 기능 시연을 목적으로 제공됩니다. 실제 상품 판매 및 배송을 위한 공식 쇼핑몰이 아니므로 구매 목적으로 이용하지 마시기 바랍니다.\n\n개인정보나 실제 결제정보를 입력하지 않도록 유의해 주세요.\n\n앞으로도 사이트 기능과 사용성을 지속적으로 개선하겠습니다.\n감사합니다.',
'공지사항', true, true),
('SEWON-MALL 주요 기능 안내',
'SEWON-MALL에서는 상품 검색 및 카테고리 탐색, 장바구니, 찜 목록, 주문과 결제 흐름 등 전자상거래 기능을 살펴볼 수 있습니다.\n\n일부 기능은 로그인 후 이용할 수 있으며, 개발 및 테스트 상황에 따라 동작이 변경될 수 있습니다.\n\n본 사이트는 시연용으로 운영됩니다.',
'서비스 안내', false, true),
('고객센터 공지사항 이용 안내',
'고객센터에서는 SEWON-MALL의 서비스 소개, 개발 관련 변경 사항, 이용 시 유의사항 등을 공지합니다.\n\n공지사항은 누구나 읽을 수 있으며, 관리자만 게시글을 등록하거나 수정할 수 있습니다.\n\n현재 별도의 1:1 고객 문의 서비스는 운영하지 않습니다.',
'이용 안내', false, true);
