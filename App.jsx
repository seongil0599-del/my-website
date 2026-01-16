import { useState, useRef } from 'react'
import { ChevronDown, ChevronUp, Printer, RefreshCw, Layers, AlertCircle } from 'lucide-react'
import html2canvas from 'html2canvas'
import './App.css'

// =======================================================================
// [규격] 오프린트미 가이드 규격 (94mm x 53mm)
// =======================================================================
const WORK_MM = { width: 94, height: 53 }
const CUT_MM = { width: 90, height: 50 }
const CARD_DPI = 300 // 인쇄용 고해상도

// 화면 표시용 픽셀 계산
const CANVAS_WIDTH = Math.round((WORK_MM.width / 25.4) * CARD_DPI)
const CANVAS_HEIGHT = Math.round((WORK_MM.height / 25.4) * CARD_DPI)
const CONTENT_WIDTH = Math.round((CUT_MM.width / 25.4) * CARD_DPI)
const CONTENT_HEIGHT = Math.round((CUT_MM.height / 25.4) * CARD_DPI)

const SCALE = 0.42

const initialFields = [
  { id: 'name', label: '이름', value: '아무개', x: 75, y: 75, fontSize: 48, fontWeight: 800, lineHeight: 1.2, color: '#000000' },
  { id: 'engName', label: '영문이름', value: 'Amugae', x: 212, y: 96, fontSize: 28, fontWeight: 600, lineHeight: 1.2, color: '#000000' },
  { id: 'infoLabel', label: '라벨', value: '인포메이션', x: 75, y: 144, fontSize: 28, fontWeight: 600, lineHeight: 1.2, color: '#000000' },
  { id: 'company', label: '회사명', value: 'Glorang Inc. | (주)글로랑', x: 75, y: 280, fontSize: 28, fontWeight: 300, lineHeight: 1.2, color: '#000000' },
  { id: 'contact', label: '연락처', value: '+82 10 6240 3815', x: 75, y: 324, fontSize: 28, fontWeight: 300, lineHeight: 1.2, color: '#000000' },
  { id: 'email', label: '이메일', value: 'gguge@glorang.com', x: 75, y: 362, fontSize: 28, fontWeight: 300, lineHeight: 1.2, color: '#000000' },
  { id: 'address', label: '주소', value: '서울 강남구 테헤란로26길 14 대세빌딩 6층', x: 75, y: 451, fontSize: 28, fontWeight: 300, lineHeight: 1.2, color: '#000000' },
  { id: 'engAddress', label: '영문주소', value: '6F, Daese Building, 14, Teheran-ro 26-gil, Gangnam-gu, Seoul', x: 75, y: 489, fontSize: 28, fontWeight: 300, lineHeight: 1.2, color: '#000000' }
]

const parseNumber = (value, fallback = 0) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

function App() {
  const [fields, setFields] = useState(initialFields)
  const [expandedFields, setExpandedFields] = useState(() =>
    initialFields.reduce((acc, field) => ({ ...acc, [field.id]: true }), {})
  )
  const [logoPosition, setLogoPosition] = useState({ x: 906, y: 75 })
  const [logoWhiteError, setLogoWhiteError] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // 인쇄용 이미지를 담을 상태
  const [printImages, setPrintImages] = useState({ front: null, back: null })

  const updateField = (id, property, value) => {
    setFields((prev) => prev.map((field) => (field.id === id ? { ...field, [property]: value } : field)))
  }

  const toggleField = (id) => {
    setExpandedFields((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // =======================================================================
  // [핵심] 브라우저 네이티브 인쇄 기능 사용
  // jsPDF 라이브러리를 쓰지 않고, 크롬의 'PDF로 저장' 기능을 활용합니다.
  // 이 방식은 '유령 폰트'가 절대 포함되지 않습니다.
  // =======================================================================
  const handleNativePrint = async (type) => {
    const elementId = type === 'front' ? 'card-paper-front' : 'card-paper-back'
    const bgColor = type === 'front' ? '#ffffff' : '#000000'
    const element = document.getElementById(elementId)
    
    if (!element) return
    setIsProcessing(true)

    try {
      // 1. 고해상도 이미지 생성 (Pretendard 폰트를 이미지로 박제)
      const canvas = await html2canvas(element, {
        scale: 4, // 300 DPI 이상급 화질
        useCORS: true,
        backgroundColor: bgColor,
        logging: false
      })
      
      const imgData = canvas.toDataURL('image/png')
      
      // 2. 인쇄용 팝업 창 열기
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        alert('팝업 차단을 해제해주세요.')
        return
      }

      // 3. 팝업 창에 이미지 하나만 딱 넣기
      printWindow.document.write(`
        <html>
          <head>
            <title>${type === 'front' ? 'business-card-front' : 'business-card-back'}</title>
            <style>
              @page { size: ${WORK_MM.width}mm ${WORK_MM.height}mm; margin: 0; } /* 오프린트미 여유분 포함 규격 설정 */
              body { margin: 0; display: flex; justify-content: center; align-items: center; background: #fff; }
              img { width: 100%; height: 100%; object-fit: contain; }
            </style>
          </head>
          <body>
            <img src="${imgData}" />
            <script>
              // 이미지가 로드되면 바로 인쇄 창 띄우기
              window.onload = () => {
                setTimeout(() => {
                  window.print();
                  window.close();
                }, 500);
              };
            </script>
          </body>
        </html>
      `)
      printWindow.document.close()

    } catch (error) {
      console.error('인쇄 준비 실패:', error)
      alert('오류가 발생했습니다.')
    } finally {
      setIsProcessing(false)
    }
  }

  const canvasInfo = `${CANVAS_WIDTH} x ${CANVAS_HEIGHT}px  •  ${WORK_MM.width} x ${WORK_MM.height}mm`

  return (
    <div className="app-shell">
      {/* Pretendard 폰트 강제 주입 */}
      <style>{`
        @import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css");
        body, input, button { font-family: "Pretendard", sans-serif !important; }
      `}</style>

      <div className="glass-header">
        <div>
          <p className="header-kicker">Card Builder</p>
          <h1 className="header-title">웹 명함 제작 도구</h1>
          <p className="header-sub">Chrome 'PDF로 저장' 사용 (폰트 오류 해결)</p>
        </div>
        <div className="header-meta">
          <span className="pill">{canvasInfo}</span>
          <span className="pill">300 DPI+</span>
        </div>
      </div>

      <div className="workspace">
        <aside className="control-panel">
           {/* ... 로고 설정 및 필드 설정 (기존과 동일하므로 생략하지 않고 유지) ... */}
           <div className="panel-section">
            <div className="panel-head">
              <p className="section-title">로고 설정</p>
            </div>
            <div className="grid-2">
              <label className="input-block">
                <span>X (px)</span>
                <input type="number" value={logoPosition.x} onChange={(e) => setLogoPosition((prev) => ({ ...prev, x: parseNumber(e.target.value, prev.x) }))} step={1} />
              </label>
              <label className="input-block">
                <span>Y (px)</span>
                <input type="number" value={logoPosition.y} onChange={(e) => setLogoPosition((prev) => ({ ...prev, y: parseNumber(e.target.value, prev.y) }))} step={1} />
              </label>
            </div>
          </div>

          <div className="panel-section">
            <div className="panel-head">
              <p className="section-title">필드 설정</p>
              <button type="button" className="ghost-btn" onClick={() => setExpandedFields((prev) => Object.fromEntries(Object.entries(prev).map(([k]) => [k, true])))}>전체 펼치기</button>
            </div>
            <div className="accordion">
              {fields.map((field) => (
                <div key={field.id} className="accordion-item">
                  <button type="button" className="accordion-trigger" onClick={() => toggleField(field.id)}>
                    <span className="field-label">{field.label}</span>
                    {expandedFields[field.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {expandedFields[field.id] && (
                    <div className="accordion-body">
                      <label className="input-block"><span>텍스트</span><input type="text" value={field.value} onChange={(e) => updateField(field.id, 'value', e.target.value)} /></label>
                      <div className="grid-2">
                        <label className="input-block"><span>X</span><input type="number" value={field.x} onChange={(e) => updateField(field.id, 'x', parseNumber(e.target.value))} /></label>
                        <label className="input-block"><span>Y</span><input type="number" value={field.y} onChange={(e) => updateField(field.id, 'y', parseNumber(e.target.value))} /></label>
                      </div>
                      <label className="input-block"><span>폰트 크기</span><input type="number" value={field.fontSize} onChange={(e) => updateField(field.id, 'fontSize', parseNumber(e.target.value))} /></label>
                      <label className="input-block"><span>폰트 두께</span><input type="number" value={field.fontWeight} onChange={(e) => updateField(field.id, 'fontWeight', parseNumber(e.target.value))} step={100} /></label>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 인쇄 버튼 영역 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '15px', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                 <Printer size={18} color="#1d4ed8" />
                 <p style={{fontSize: '14px', fontWeight: 'bold', color: '#1d4ed8'}}>PDF 생성 (브라우저 엔진)</p>
               </div>
               <p style={{fontSize: '12px', color: '#1e40af', lineHeight: '1.4'}}>
                 <b>[사용법]</b> 버튼을 누르면 인쇄 창이 뜹니다.<br/>
                 대상(Destination)을 <b>'PDF로 저장'</b>으로 선택하고 저장하세요.<br/>
                 <span style={{color: '#ef4444', fontWeight: 'bold'}}>* 폰트 오류가 절대 발생하지 않습니다.</span>
               </p>
               
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button 
                  type="button" 
                  className="primary-btn" 
                  onClick={() => handleNativePrint('front')}
                  disabled={isProcessing}
                  style={{ backgroundColor: '#2563eb', height: '48px', fontSize: '14px' }}
                >
                  앞면 PDF 만들기
                </button>
                <button 
                  type="button" 
                  className="primary-btn" 
                  onClick={() => handleNativePrint('back')}
                  disabled={isProcessing}
                  style={{ backgroundColor: '#1e40af', height: '48px', fontSize: '14px' }}
                >
                  뒷면 PDF 만들기
                </button>
              </div>
            </div>

          </div>
        </aside>

        <main className="preview-panel">
          <div className="preview-head">
            <div>
              <p className="section-title">실시간 미리보기</p>
              <p className="section-sub">94x53mm 규격</p>
            </div>
            <span className="pill">{Math.round(CANVAS_WIDTH * SCALE)}px View</span>
          </div>

          <div className="preview-stage">
            {/* 앞면 */}
            <div className="canvas-shell" style={{ width: `${CANVAS_WIDTH * SCALE}px`, height: `${CANVAS_HEIGHT * SCALE}px`, margin: '0 auto 20px' }}>
                <div id="card-paper-front" style={{ width: `${CANVAS_WIDTH}px`, height: `${CANVAS_HEIGHT}px`, transform: `scale(${SCALE})`, transformOrigin: 'top left', position: 'absolute', inset: 0, backgroundColor: '#ffffff', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <div style={{ width: `${CONTENT_WIDTH}px`, height: `${CONTENT_HEIGHT}px`, position: 'relative', backgroundColor: '#ffffff' }}>
                    {fields.map((field) => field.value && (
                        <div key={field.id} style={{ position: 'absolute', top: `${field.y}px`, left: `${field.x}px`, fontSize: `${field.fontSize}px`, fontWeight: field.fontWeight, lineHeight: field.lineHeight, color: field.color, whiteSpace: 'nowrap', fontFamily: 'Pretendard' }}>{field.value}</div>
                    ))}
                    <img src="/logo.png" alt="Logo" style={{ position: 'absolute', left: `${logoPosition.x}px`, top: `${logoPosition.y}px`, width: '84px', height: '84px', objectFit: 'contain' }} />
                  </div>
                </div>
            </div>

            {/* 뒷면 */}
            <div className="canvas-shell" style={{ width: `${CANVAS_WIDTH * SCALE}px`, height: `${CANVAS_HEIGHT * SCALE}px`, margin: '0 auto' }}>
                <div id="card-paper-back" style={{ width: `${CANVAS_WIDTH}px`, height: `${CANVAS_HEIGHT}px`, transform: `scale(${SCALE})`, transformOrigin: 'top left', position: 'absolute', inset: 0, backgroundColor: '#000000', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ 
                  width: `${CONTENT_WIDTH}px`, 
                  height: `${CONTENT_HEIGHT}px`, 
                  position: 'relative', 
                  backgroundColor: '#000000',
                  display: 'flex',           // 추가: 플렉스 박스 사용
                  justifyContent: 'center',  // 추가: 가로 가운데 정렬
                  alignItems: 'center'       // 추가: 세로 가운데 정렬
}}>
                    {!logoWhiteError ? <img src="/logo-white.png" alt="Logo White" onError={() => setLogoWhiteError(true)} style={{ width: '530px', height: 'auto', objectFit: 'contain' }} /> : <div style={{ color: 'white' }}>Logo White</div>}
                  </div>
                </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App