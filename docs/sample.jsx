import { useState, useCallback } from "react";

const MOCK_FILES = [
  {
    path: "src/components/Header.tsx",
    status: "modified",
    size: { source: "4.2KB", dest: "3.8KB" },
    sourceModified: "2026-03-14 09:23",
    destModified: "2026-03-10 14:11",
    gitLog: [
      { hash: "a3f1c2d", author: "김민수", date: "2026-03-14 09:23", message: "Header 반응형 브레이크포인트 수정" },
      { hash: "e7b4a1f", author: "김민수", date: "2026-03-13 17:45", message: "Header 네비게이션 메뉴 추가" },
      { hash: "1d9f3e2", author: "이지은", date: "2026-03-12 11:30", message: "Header 로고 이미지 교체" },
    ],
  },
  {
    path: "src/pages/Dashboard.tsx",
    status: "modified",
    size: { source: "12.1KB", dest: "10.4KB" },
    sourceModified: "2026-03-14 08:50",
    destModified: "2026-03-08 09:22",
    gitLog: [
      { hash: "b2c8d4e", author: "박서준", date: "2026-03-14 08:50", message: "대시보드 차트 데이터 바인딩 수정" },
      { hash: "f1a7e3c", author: "김민수", date: "2026-03-13 15:20", message: "대시보드 필터 기능 구현" },
    ],
  },
  {
    path: "src/utils/api.ts",
    status: "new",
    size: { source: "2.8KB", dest: "-" },
    sourceModified: "2026-03-13 16:40",
    destModified: "-",
    gitLog: [
      { hash: "c4d2f1a", author: "이지은", date: "2026-03-13 16:40", message: "API 유틸 함수 분리" },
    ],
  },
  {
    path: "src/hooks/useAuth.ts",
    status: "modified",
    size: { source: "1.9KB", dest: "1.5KB" },
    sourceModified: "2026-03-14 10:15",
    destModified: "2026-03-09 13:44",
    gitLog: [
      { hash: "d8e1f2b", author: "김민수", date: "2026-03-14 10:15", message: "토큰 리프레시 로직 개선" },
      { hash: "a2b3c4d", author: "김민수", date: "2026-03-12 09:00", message: "useAuth 훅 초기 구현" },
    ],
  },
  {
    path: "Dockerfile",
    status: "modified",
    size: { source: "1.1KB", dest: "1.3KB" },
    sourceModified: "2026-03-11 14:00",
    destModified: "2026-03-07 10:30",
    gitLog: [
      { hash: "e5f6a7b", author: "박서준", date: "2026-03-11 14:00", message: "Node 버전 업데이트" },
    ],
  },
  {
    path: ".github/workflows/deploy.yml",
    status: "modified",
    size: { source: "2.4KB", dest: "3.1KB" },
    sourceModified: "2026-03-10 11:20",
    destModified: "2026-03-06 16:55",
    gitLog: [
      { hash: "f8a9b1c", author: "박서준", date: "2026-03-10 11:20", message: "배포 스크립트 스테이지 추가" },
    ],
  },
  {
    path: "src/styles/global.css",
    status: "modified",
    size: { source: "5.6KB", dest: "5.1KB" },
    sourceModified: "2026-03-14 07:30",
    destModified: "2026-03-09 08:15",
    gitLog: [
      { hash: "a1b2c3d", author: "이지은", date: "2026-03-14 07:30", message: "다크모드 색상 변수 추가" },
      { hash: "e4f5a6b", author: "이지은", date: "2026-03-13 14:10", message: "글로벌 리셋 스타일 정리" },
    ],
  },
  {
    path: "src/components/Modal.tsx",
    status: "new",
    size: { source: "3.4KB", dest: "-" },
    sourceModified: "2026-03-13 13:55",
    destModified: "-",
    gitLog: [
      { hash: "b7c8d9e", author: "김민수", date: "2026-03-13 13:55", message: "공통 모달 컴포넌트 생성" },
    ],
  },
  {
    path: "src/types/index.ts",
    status: "modified",
    size: { source: "1.2KB", dest: "0.8KB" },
    sourceModified: "2026-03-14 09:00",
    destModified: "2026-03-10 10:00",
    gitLog: [
      { hash: "c1d2e3f", author: "박서준", date: "2026-03-14 09:00", message: "Dashboard 관련 타입 추가" },
    ],
  },
];

const DANGER_FILES = ["Dockerfile", ".github/workflows/deploy.yml", "docker-compose.yml", ".env", "k8s/"];

function isDangerFile(path) {
  return DANGER_FILES.some((d) => path.includes(d));
}

const StatusBadge = ({ status }) => {
  const colors = {
    modified: { bg: "#2d2a1e", color: "#e8b931", border: "#5c4d1a" },
    new: { bg: "#1a2e1a", color: "#4eca6a", border: "#2a5c2a" },
    deleted: { bg: "#2e1a1a", color: "#e84040", border: "#5c2a2a" },
  };
  const c = colors[status] || colors.modified;
  return (
    <span
      style={{
        fontSize: 11,
        padding: "2px 8px",
        borderRadius: 3,
        background: c.bg,
        color: c.color,
        border: `1px solid ${c.border}`,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
      }}
    >
      {status}
    </span>
  );
};

const WarningIcon = () => (
  <span title="인프라/배포 파일 — 덮어쓰기 주의!" style={{ color: "#e8b931", fontSize: 14, marginRight: 4, cursor: "help" }}>
    ⚠
  </span>
);

export default function SISyncTool() {
  const [step, setStep] = useState("select"); // select | diff
  const [sourcePath, setSourcePath] = useState("");
  const [destPath, setDestPath] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [checkedFiles, setCheckedFiles] = useState(new Set());
  const [synced, setSynced] = useState(false);
  const [scanning, setScanning] = useState(false);

  const handleScan = () => {
    if (!sourcePath || !destPath) return;
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setStep("diff");
    }, 800);
  };

  const toggleCheck = (path) => {
    setCheckedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const toggleAll = () => {
    if (checkedFiles.size === MOCK_FILES.length) {
      setCheckedFiles(new Set());
    } else {
      setCheckedFiles(new Set(MOCK_FILES.map((f) => f.path)));
    }
  };

  const handleSync = () => {
    if (checkedFiles.size === 0) return;
    const dangerSelected = [...checkedFiles].filter(isDangerFile);
    if (dangerSelected.length > 0) {
      const msg = `⚠ 인프라/배포 파일이 포함되어 있습니다:\n\n${dangerSelected.join("\n")}\n\n정말 덮어쓰시겠습니까?`;
      if (!confirm(msg)) return;
    }
    setSynced(true);
    setTimeout(() => setSynced(false), 2500);
  };

  const handleReset = () => {
    setStep("select");
    setSourcePath("");
    setDestPath("");
    setSelectedFile(null);
    setCheckedFiles(new Set());
  };

  const activeFile = MOCK_FILES.find((f) => f.path === selectedFile);

  const hasDanger = [...checkedFiles].some(isDangerFile);

  return (
    <div
      style={{
        fontFamily: "'JetBrains Mono', 'SF Mono', 'Consolas', monospace",
        background: "#0d1117",
        color: "#c9d1d9",
        minHeight: "100vh",
        fontSize: 13,
      }}
    >
      {/* Title Bar */}
      <div
        style={{
          background: "#161b22",
          borderBottom: "1px solid #30363d",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16 }}>📂</span>
          <span style={{ fontWeight: 700, fontSize: 14, color: "#e6edf3" }}>SI Sync</span>
          <span style={{ fontSize: 11, color: "#8b949e", marginLeft: 4 }}>v1.0</span>
        </div>
        {step === "diff" && (
          <button
            onClick={handleReset}
            style={{
              background: "none",
              border: "1px solid #30363d",
              color: "#8b949e",
              padding: "4px 12px",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 12,
              fontFamily: "inherit",
            }}
          >
            ← 폴더 다시 선택
          </button>
        )}
      </div>

      {/* Step 1: Folder Selection */}
      {step === "select" && (
        <div style={{ padding: 40, maxWidth: 560, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📂 → 📂</div>
            <h2 style={{ color: "#e6edf3", fontWeight: 600, fontSize: 18, margin: 0 }}>프로젝트 폴더 동기화</h2>
            <p style={{ color: "#8b949e", fontSize: 12, marginTop: 8 }}>출발지(회사)와 목적지(고객사) 폴더를 선택하세요</p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", color: "#8b949e", fontSize: 11, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
              출발지 (회사 프로젝트)
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={sourcePath}
                onChange={(e) => setSourcePath(e.target.value)}
                placeholder="/Users/dev/company/project-a"
                style={{
                  flex: 1,
                  background: "#0d1117",
                  border: "1px solid #30363d",
                  borderRadius: 4,
                  color: "#c9d1d9",
                  padding: "10px 12px",
                  fontSize: 13,
                  fontFamily: "inherit",
                  outline: "none",
                }}
              />
              <button
                onClick={() => setSourcePath("/Users/dev/company/project-a")}
                style={{
                  background: "#21262d",
                  border: "1px solid #30363d",
                  color: "#c9d1d9",
                  padding: "0 14px",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 12,
                  fontFamily: "inherit",
                  whiteSpace: "nowrap",
                }}
              >
                찾아보기
              </button>
            </div>
          </div>

          <div style={{ textAlign: "center", color: "#30363d", margin: "16px 0", fontSize: 18 }}>↓</div>

          <div style={{ marginBottom: 32 }}>
            <label style={{ display: "block", color: "#8b949e", fontSize: 11, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
              목적지 (고객사 프로젝트)
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={destPath}
                onChange={(e) => setDestPath(e.target.value)}
                placeholder="/Users/dev/client/project-a"
                style={{
                  flex: 1,
                  background: "#0d1117",
                  border: "1px solid #30363d",
                  borderRadius: 4,
                  color: "#c9d1d9",
                  padding: "10px 12px",
                  fontSize: 13,
                  fontFamily: "inherit",
                  outline: "none",
                }}
              />
              <button
                onClick={() => setDestPath("/Users/dev/client/project-a")}
                style={{
                  background: "#21262d",
                  border: "1px solid #30363d",
                  color: "#c9d1d9",
                  padding: "0 14px",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 12,
                  fontFamily: "inherit",
                  whiteSpace: "nowrap",
                }}
              >
                찾아보기
              </button>
            </div>
          </div>

          <button
            onClick={handleScan}
            disabled={!sourcePath || !destPath || scanning}
            style={{
              width: "100%",
              background: sourcePath && destPath ? "#238636" : "#21262d",
              border: "1px solid " + (sourcePath && destPath ? "#2ea043" : "#30363d"),
              color: sourcePath && destPath ? "#fff" : "#484f58",
              padding: "12px 0",
              borderRadius: 6,
              cursor: sourcePath && destPath ? "pointer" : "not-allowed",
              fontSize: 14,
              fontWeight: 600,
              fontFamily: "inherit",
              transition: "all 0.15s",
            }}
          >
            {scanning ? "스캔 중..." : "차이점 스캔"}
          </button>
        </div>
      )}

      {/* Step 2: Diff View */}
      {step === "diff" && (
        <div style={{ display: "flex", height: "calc(100vh - 45px)" }}>
          {/* File List Panel */}
          <div style={{ width: 420, borderRight: "1px solid #30363d", display: "flex", flexDirection: "column" }}>
            {/* Path Info */}
            <div style={{ padding: "10px 14px", borderBottom: "1px solid #30363d", background: "#161b22" }}>
              <div style={{ fontSize: 11, color: "#8b949e", marginBottom: 4 }}>
                <span style={{ color: "#3fb950" }}>출발</span> {sourcePath}
              </div>
              <div style={{ fontSize: 11, color: "#8b949e" }}>
                <span style={{ color: "#f0883e" }}>목적</span> {destPath}
              </div>
            </div>

            {/* Toolbar */}
            <div
              style={{
                padding: "8px 14px",
                borderBottom: "1px solid #30363d",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#0d1117",
              }}
            >
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12 }}>
                <input
                  type="checkbox"
                  checked={checkedFiles.size === MOCK_FILES.length}
                  onChange={toggleAll}
                  style={{ accentColor: "#238636" }}
                />
                전체 선택
              </label>
              <span style={{ fontSize: 11, color: "#8b949e" }}>
                {MOCK_FILES.length}개 파일 변경됨 · {checkedFiles.size}개 선택
              </span>
            </div>

            {/* File List */}
            <div style={{ flex: 1, overflow: "auto" }}>
              {MOCK_FILES.map((file) => {
                const danger = isDangerFile(file.path);
                const isActive = selectedFile === file.path;
                return (
                  <div
                    key={file.path}
                    onClick={() => setSelectedFile(file.path)}
                    style={{
                      padding: "10px 14px",
                      borderBottom: "1px solid #21262d",
                      cursor: "pointer",
                      background: isActive ? "#161b22" : "transparent",
                      borderLeft: isActive ? "2px solid #58a6ff" : "2px solid transparent",
                      transition: "all 0.1s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={checkedFiles.has(file.path)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleCheck(file.path);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        style={{ accentColor: "#238636", flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {danger && <WarningIcon />}
                          <span
                            style={{
                              fontSize: 13,
                              color: danger ? "#e8b931" : "#e6edf3",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {file.path}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: "#8b949e", marginTop: 3 }}>
                          {file.gitLog[0].author} · {file.gitLog[0].message.slice(0, 30)}
                          {file.gitLog[0].message.length > 30 ? "..." : ""}
                        </div>
                      </div>
                      <StatusBadge status={file.status} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sync Button */}
            <div style={{ padding: 14, borderTop: "1px solid #30363d", background: "#161b22" }}>
              {synced ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "12px 0",
                    color: "#3fb950",
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  ✓ {checkedFiles.size}개 파일 동기화 완료!
                </div>
              ) : (
                <button
                  onClick={handleSync}
                  disabled={checkedFiles.size === 0}
                  style={{
                    width: "100%",
                    background: checkedFiles.size > 0 ? (hasDanger ? "#9e6a03" : "#238636") : "#21262d",
                    border: "1px solid " + (checkedFiles.size > 0 ? (hasDanger ? "#bb8009" : "#2ea043") : "#30363d"),
                    color: checkedFiles.size > 0 ? "#fff" : "#484f58",
                    padding: "12px 0",
                    borderRadius: 6,
                    cursor: checkedFiles.size > 0 ? "pointer" : "not-allowed",
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: "inherit",
                  }}
                >
                  {hasDanger ? `⚠ ${checkedFiles.size}개 파일 덮어쓰기 (주의 필요)` : `${checkedFiles.size}개 파일 덮어쓰기`}
                </button>
              )}
            </div>
          </div>

          {/* Detail Panel */}
          <div style={{ flex: 1, background: "#0d1117", overflow: "auto" }}>
            {activeFile ? (
              <div>
                {/* File Header */}
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #30363d", background: "#161b22" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <StatusBadge status={activeFile.status} />
                    {isDangerFile(activeFile.path) && <WarningIcon />}
                    <span style={{ fontSize: 15, fontWeight: 600, color: "#e6edf3" }}>{activeFile.path}</span>
                  </div>
                  <div style={{ display: "flex", gap: 24, fontSize: 12, color: "#8b949e" }}>
                    <span>
                      출발: <span style={{ color: "#3fb950" }}>{activeFile.size.source}</span> · {activeFile.sourceModified}
                    </span>
                    <span>
                      목적: <span style={{ color: "#f0883e" }}>{activeFile.size.dest}</span> · {activeFile.destModified}
                    </span>
                  </div>
                </div>

                {/* Danger Warning */}
                {isDangerFile(activeFile.path) && (
                  <div
                    style={{
                      margin: "16px 20px",
                      padding: "12px 16px",
                      background: "#2d2a1e",
                      border: "1px solid #5c4d1a",
                      borderRadius: 6,
                      fontSize: 12,
                      color: "#e8b931",
                      lineHeight: 1.6,
                    }}
                  >
                    ⚠ <strong>인프라/배포 파일</strong>입니다. 회사와 고객사의 배포 환경이 다를 수 있으므로 덮어쓰기 시 주의가 필요합니다.
                  </div>
                )}

                {/* Git Log */}
                <div style={{ padding: "16px 20px" }}>
                  <h3 style={{ fontSize: 12, color: "#8b949e", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16, fontWeight: 500 }}>
                    Git 이력 (출발지)
                  </h3>
                  <div>
                    {activeFile.gitLog.map((log, i) => (
                      <div
                        key={log.hash}
                        style={{
                          display: "flex",
                          gap: 12,
                          marginBottom: 0,
                          position: "relative",
                          paddingBottom: i < activeFile.gitLog.length - 1 ? 20 : 0,
                        }}
                      >
                        {/* Timeline */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 20, flexShrink: 0 }}>
                          <div
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              background: i === 0 ? "#58a6ff" : "#30363d",
                              border: "2px solid " + (i === 0 ? "#58a6ff" : "#484f58"),
                              flexShrink: 0,
                            }}
                          />
                          {i < activeFile.gitLog.length - 1 && (
                            <div style={{ width: 2, flex: 1, background: "#21262d", marginTop: 4 }} />
                          )}
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, paddingBottom: 4 }}>
                          <div style={{ fontSize: 13, color: "#e6edf3", marginBottom: 4, lineHeight: 1.4 }}>{log.message}</div>
                          <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#8b949e" }}>
                            <span
                              style={{
                                background: "#161b22",
                                padding: "1px 6px",
                                borderRadius: 3,
                                fontFamily: "inherit",
                                color: "#58a6ff",
                              }}
                            >
                              {log.hash}
                            </span>
                            <span>{log.author}</span>
                            <span>{log.date}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#484f58" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>📄</div>
                  <div>파일을 선택하면 상세 정보가 표시됩니다</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}