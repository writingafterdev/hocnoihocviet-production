import Link from 'next/link';
import s from './landing.module.css';

const cx = (...names: string[]) => names.map((n) => s[n]).join(' ');

/** Public marketing page for IELTS Writing: shows the product itself (a chain, the rope, a scored paragraph). */
export function Landing() {
  return (
    <div className={s.page}>
      <div className={s.w}>
        <nav className={s.nav}>
          <Link className={s.mark} href="/">hocnoihocviet</Link>
          <div className={s.navr}>
            <a href="#cach">Cách hoạt động</a>
            <Link href="/login">Đăng nhập</Link>
            <Link className={cx('btn', 'sm')} href="/home">Bắt đầu</Link>
          </div>
        </nav>

        <section className={s.hero} aria-label="Giới thiệu">
          <div>
            <span className={s.lbl}>IELTS Writing · Task 2</span>
            <h1>Bài viết yếu thường vì <i>ý</i> chưa thông, không phải vì câu chữ.</h1>
            <p>Dựng lập luận thành từng mạch, tự tìm chỗ nhảy cóc, rồi mới viết. Không ai viết hộ bạn.</p>
            <Link className={s.btn} href="/home">Viết bài đầu tiên</Link>
            <div className={s.meta}><span>Miễn phí khi đang beta</span><span>·</span><span>40 phút một đề</span></div>
          </div>
          <div style={{ position: 'relative' }}>
            <div className={s['hero-ill']}><img src="/assets/illustrations/il-thinking.svg" alt="" /></div>
            <div className={s.sheet} aria-label="Ví dụ một mạch lập luận">
              <div className={s.hd}><span className={s.lbl}>Mạch 2</span><span style={{ fontSize: 12, color: '#77776F' }}>1 chỗ cần xem</span></div>
              <p className={s.prompt}>Some people believe that all parents should be required to take childcare training courses. To what extent do you agree or disagree?</p>
              <ol className={s.chain}>
                <li><span className={cx('dot', 'd')} />All parents are required to attend</li>
                <li><span className={s.dot} />Every household must make time for the course</li>
                <li className={s.jump}><span className={s.dot} />Working parents rearrange work or childcare</li>
                <li><span className={s.dot} /><span>The requirement creates financial <span className={s.vague}>pressure</span></span></li>
              </ol>
              <div className={s.note}><b>Bước 3 → 4</b>Xáo lịch chưa phải là mất tiền. Ai biến việc xáo lịch thành áp lực tài chính, và bằng cách nào?</div>
            </div>
          </div>
        </section>

        <section className={s.steps} id="cach" aria-label="Cách hoạt động">
          <div className={s.row}>
            <div><div className={s.ill}><img src="/assets/illustrations/il-brainstorm.svg" alt="" /></div><span className={s.num}>01</span></div>
            <div><h2>Dựng mạch</h2><p>Mỗi lý do là một chuỗi bước nối nhau. Viết từng bước, từ chính sách tới người chịu ảnh hưởng.</p></div>
            <div className={s.sheet}>
              <ol className={s.chain} style={{ paddingBottom: 4 }}>
                <li><span className={cx('dot', 'd')} />Childcare course</li>
                <li><span className={s.dot} />Parents gain practical knowledge</li>
                <li><span className={s.dot} />They apply it in everyday care</li>
              </ol>
            </div>
          </div>
          <div className={s.row}>
            <div><div className={s.ill}><img src="/assets/illustrations/il-review.svg" alt="" /></div><span className={s.num}>02</span></div>
            <div><h2>Thử mạch, rồi xếp phía</h2><p>Soi mỗi mạch qua 5 góc: With/Without, Scope, Khả thi, Dài hạn, Quy mô. Mỗi phát hiện kéo về một trong hai phía.</p></div>
            <div className={cx('sheet', 'rope')}>
              <div className={s.side}>
                <span className={s.lbl}>Phản đối</span>
                <div className={s.chips}>
                  <span className={cx('chip', 'u')}><i style={{ background: '#D5452E' }} />2</span>
                  <span className={s.chip}><i style={{ background: '#7B4D10' }} />2 · QM</span>
                  <span className={cx('chip', 'u')}><i style={{ background: '#62DAB1' }} />1b</span>
                </div>
              </div>
              <div className={s.side}>
                <span className={s.lbl}>Đồng ý</span>
                <div className={s.chips}>
                  <span className={cx('chip', 'u')}><i style={{ background: '#62DAB1' }} />1a</span>
                  <span className={s.chip}><i style={{ background: '#17667A' }} />1 · W/W</span>
                </div>
              </div>
            </div>
          </div>
          <div className={s.row}>
            <div><div className={s.ill}><img src="/assets/illustrations/il-editing.svg" alt="" /></div><span className={s.num}>03</span></div>
            <div><h2>Viết, nộp, sửa</h2><p>Viết theo thứ tự các mạch. Khi nộp, bài được chấm theo 4 tiêu chí và chỉ ra đoạn nào đi lệch khỏi mạch của chính bạn.</p></div>
            <div className={s.sheet}>
              <p className={s.essay}>Requiring every parent to attend such courses would place an uneven burden on working families, who would have to rearrange their schedules.</p>
              <div className={s.scores}>
                <div className={cx('sc', 'm')}><span>BAND</span><b>6.5</b></div>
                <div className={s.sc}><span>TR</span><b>6.0</b></div>
                <div className={s.sc}><span>CC</span><b>7.0</b></div>
                <div className={s.sc}><span>LR</span><b>6.5</b></div>
                <div className={s.sc}><span>GRA</span><b>6.5</b></div>
              </div>
            </div>
          </div>
        </section>

        <section className={s.close} aria-label="Bắt đầu">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32, alignItems: 'flex-start' }}>
            <h2>Nghĩ cho thông trước. Câu chữ sẽ theo sau.</h2>
            <Link className={s.btn} href="/home">Bắt đầu viết</Link>
          </div>
          <div className={s['close-ill']}><img src="/assets/illustrations/il-writing.svg" alt="" /></div>
        </section>

        <footer className={s.foot}><span>hocnoihocviet © 2026</span><span>Beta</span></footer>
      </div>
    </div>
  );
}
