import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";

function SuccessParticles({ buttonRef }) {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return null;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    return (
        <AnimatePresence>
            {[...Array(6)].map((_, i) => (
                <motion.div
                    key={i}
                    className="fixed w-1.5 h-1.5 bg-[#00c9a7] rounded-full z-50 pointer-events-none"
                    style={{ left: centerX, top: centerY }}
                    initial={{ scale: 0, x: 0, y: 0 }}
                    animate={{
                        scale: [0, 1, 0],
                        x: [0, (i % 2 ? 1 : -1) * (Math.random() * 50 + 20)],
                        y: [0, -Math.random() * 50 - 20],
                    }}
                    transition={{
                        duration: 0.6,
                        delay: i * 0.1,
                        ease: "easeOut",
                    }}
                />
            ))}
        </AnimatePresence>
    );
}

export function ParticleButton({
    children,
    onClick,
    successDuration = 1000,
    className,
    ...props
}) {
    const [showParticles, setShowParticles] = useState(false);
    const buttonRef = useRef(null);

    const handleClick = (e) => {
        setShowParticles(true);
        if (onClick) onClick(e);

        setTimeout(() => {
            setShowParticles(false);
        }, successDuration);
    };

    return (
        <>
            {showParticles && <SuccessParticles buttonRef={buttonRef} />}
            <button
                ref={buttonRef}
                onClick={handleClick}
                className={cn(
                    "relative overflow-hidden transition-all duration-200",
                    showParticles && "scale-95",
                    className
                )}
                {...props}
            >
                {children}
            </button>
        </>
    );
}
