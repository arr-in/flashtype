import { FlashRunner } from "./FlashRunner";
import "./FlashRunnerHero.css";

/**
 * Hero-level running animation — kinetic speed track beneath the title area.
 */
export default function FlashRunnerHero({ variant = "default" }) {
  return (
    <div className={`ft-runner-hero ft-runner-hero--${variant}`} aria-hidden="true">
      <div className="ft-runner-hero-track">
        <div className="ft-runner-hero-lane">
          <div className="ft-runner-hero-streaks">
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i} className={`ft-runner-hero-streak ft-runner-hero-streak--${i}`} />
            ))}
          </div>
          <div className="ft-runner-hero-runner-wrap">
            <FlashRunner size={40} isMoving />
          </div>
          <div className="ft-runner-hero-finish">
            <span className="ft-runner-hero-finish-flag" />
          </div>
        </div>
      </div>
    </div>
  );
}
