import openai
from typing import List, Dict
import json
from datetime import datetime

class RailwayAIAssistant:
    def __init__(self):
        # For demo purposes, we'll use a simple rule-based system
        # In production, you'd use OpenAI API or local LLM
        self.explanations_db = {
            "platform_change": [
                "Platform reassignment reduces conflicts with incoming trains",
                "Moving to Platform {new_platform} optimizes station throughput",
                "Platform {new_platform} has better connectivity for onward journey"
            ],
            "time_change": [
                "Departure time adjusted to avoid platform congestion",
                "Rescheduled to {new_time} to accommodate high-priority trains",
                "Time optimization reduces overall network delays by {delay_reduction} minutes"
            ],
            "delay_reduction": [
                "AI identified opportunity to reduce delay through optimal routing",
                "Priority scheduling allows faster platform turnover",
                "Predictive optimization prevents cascade delays"
            ]
        }
    
    def explain_optimization_decision(self, original_movement: Dict, 
                                    optimized_movement: Dict, 
                                    context: Dict = None) -> Dict:
        """
        Generate human-readable explanation for optimization decisions
        """
        explanations = []
        decision_factors = []
        
        # Platform change explanation
        if optimized_movement["original_platform"] != optimized_movement["optimized_platform"]:
            explanation = f"Train {optimized_movement['train_id']} moved from Platform {optimized_movement['original_platform']} to Platform {optimized_movement['optimized_platform']}"
            reason = "to resolve platform conflict and improve station throughput"
            explanations.append(f"{explanation} {reason}")
            decision_factors.append("platform_conflict_resolution")
        
        # Time change explanation
        if optimized_movement["original_departure"] != optimized_movement["optimized_departure"]:
            time_diff = optimized_movement["optimized_departure"] - optimized_movement["original_departure"]
            direction = "delayed" if time_diff > 0 else "advanced"
            explanation = f"Departure time {direction} by {abs(time_diff)} hour(s)"
            
            if time_diff > 0:
                reason = "to allow higher-priority trains to depart first"
            else:
                reason = "to utilize available platform capacity efficiently"
            
            explanations.append(f"{explanation} {reason}")
            decision_factors.append("temporal_optimization")
        
        # Delay improvement explanation
        if optimized_movement.get("delay_reduction", 0) > 0:
            delay_improvement = optimized_movement["delay_reduction"]
            explanation = f"Reduced delay by {delay_improvement} minutes through intelligent scheduling"
            explanations.append(explanation)
            decision_factors.append("delay_minimization")
        
        # Generate overall impact explanation
        impact_explanation = self._generate_impact_explanation(optimized_movement, context)
        
        return {
            "train_id": optimized_movement["train_id"],
            "primary_explanation": explanations[0] if explanations else "No significant changes made",
            "detailed_explanations": explanations,
            "decision_factors": decision_factors,
            "impact_explanation": impact_explanation,
            "confidence_score": self._calculate_confidence_score(decision_factors),
            "timestamp": datetime.now().isoformat()
        }
    
    def _generate_impact_explanation(self, optimized_movement: Dict, context: Dict) -> str:
        """Generate explanation of broader impact"""
        delay_reduction = optimized_movement.get("delay_reduction", 0)
        platform_change = optimized_movement["original_platform"] != optimized_movement["optimized_platform"]
        
        if delay_reduction > 15:
            return f"This optimization prevents cascade delays and improves punctuality for downstream stations"
        elif platform_change:
            return f"Platform optimization increases station capacity utilization by reducing bottlenecks"
        else:
            return f"Minor adjustment maintains system stability while optimizing overall network performance"
    
    def _calculate_confidence_score(self, decision_factors: List[str]) -> float:
        """Calculate confidence score for the explanation"""
        factor_weights = {
            "platform_conflict_resolution": 0.9,
            "temporal_optimization": 0.8,
            "delay_minimization": 0.95,
            "priority_balancing": 0.85
        }
        
        if not decision_factors:
            return 0.5
        
        total_confidence = sum(factor_weights.get(factor, 0.7) for factor in decision_factors)
        return min(0.99, total_confidence / len(decision_factors))
    
    def generate_system_summary(self, optimization_result: Dict) -> Dict:
        """Generate overall system performance summary"""
        metrics = optimization_result.get("advanced_metrics", {})
        movements = optimization_result.get("movements", [])
        
        # Analyze optimization performance
        improvement = metrics.get("improvement_percent", 0)
        conflicts_resolved = metrics.get("conflicts_resolved", 0)
        
        if improvement >= 30:
            performance_level = "Excellent"
            performance_description = "AI achieved significant optimization with substantial delay reduction"
        elif improvement >= 20:
            performance_level = "Very Good"  
            performance_description = "Strong optimization results with notable efficiency improvements"
        elif improvement >= 10:
            performance_level = "Good"
            performance_description = "Solid improvements achieved through intelligent scheduling"
        else:
            performance_level = "Moderate"
            performance_description = "Minor optimizations applied to maintain system stability"
        
        # Key insights
        insights = []
        if conflicts_resolved > 0:
            insights.append(f"Resolved {conflicts_resolved} platform conflicts through intelligent rescheduling")
        
        if metrics.get("priority_satisfaction", 0) > 80:
            insights.append("High-priority trains received optimal scheduling preference")
        
        if metrics.get("throughput_score", 0) > 100:
            insights.append("Peak hour capacity utilization optimized for maximum throughput")
        
        return {
            "performance_level": performance_level,
            "performance_description": performance_description,
            "key_insights": insights,
            "recommendation": self._generate_recommendation(metrics),
            "next_optimization_opportunity": self._identify_next_opportunity(movements)
        }
    
    def _generate_recommendation(self, metrics: Dict) -> str:
        """Generate recommendation for railway controllers"""
        improvement = metrics.get("improvement_percent", 0)
        
        if improvement >= 25:
            return "Implement this optimization immediately - significant benefits with low risk"
        elif improvement >= 15:
            return "Strong optimization candidate - consider implementation during next scheduling window"
        elif improvement >= 10:
            return "Moderate improvement - implement if system resources allow"
        else:
            return "Minor optimization - consider combining with other efficiency measures"
    
    def _identify_next_opportunity(self, movements: List[Dict]) -> str:
        """Identify next optimization opportunity"""
        high_delay_trains = [m for m in movements if m.get("optimized_delay", 0) > 20]
        
        if high_delay_trains:
            return f"Focus on {len(high_delay_trains)} trains still experiencing delays > 20 minutes"
        
        platform_changes = [m for m in movements if m["original_platform"] != m["optimized_platform"]]
        if len(platform_changes) > 3:
            return "Consider infrastructure improvements at high-congestion stations"
        
        return "System running efficiently - monitor for emerging bottlenecks"

# Add to main.py
ai_assistant = RailwayAIAssistant()

@app.post("/api/explain-optimization")
async def explain_optimization_decisions(request: dict):
    """Get AI explanations for optimization decisions"""
    try:
        optimization_result = request.get("optimization_result")
        explanations = []
        
        for movement in optimization_result.get("movements", []):
            explanation = ai_assistant.explain_optimization_decision(
                original_movement={}, 
                optimized_movement=movement
            )
            explanations.append(explanation)
        
        system_summary = ai_assistant.generate_system_summary(optimization_result)
        
        return {
            "individual_explanations": explanations,
            "system_summary": system_summary,
            "total_explanations": len(explanations)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Explanation generation failed: {str(e)}")
