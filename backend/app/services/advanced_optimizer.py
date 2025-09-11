from ortools.sat.python import cp_model
from typing import List, Dict, Tuple
import numpy as np
from app.models.train import OptimizationRequest

class AdvancedRailwayOptimizer:
    def __init__(self):
        self.model = None
        self.solver = None
        self.objectives = ["minimize_delays", "maximize_throughput", "balance_priorities"]
        
    def multi_objective_optimize(self, request: OptimizationRequest, 
                                objective_weights: Dict[str, float] = None) -> Dict:
        """
        Advanced multi-objective optimization
        """
        if objective_weights is None:
            objective_weights = {
                "delay_minimization": 0.4,
                "throughput_maximization": 0.3,
                "priority_balancing": 0.2,
                "conflict_resolution": 0.1
            }
        
        try:
            self.model = cp_model.CpModel()
            
            trains = {t.id: t for t in request.trains}
            stations = {s.id: s for s in request.stations}
            movements = request.movements
            
            # Enhanced decision variables
            departure_vars = {}
            platform_vars = {}
            delay_vars = {}
            throughput_vars = {}
            
            for i, movement in enumerate(movements):
                # Departure time (expanded range: 6 AM to 11 PM)
                departure_vars[i] = self.model.NewIntVar(6, 23, f'departure_{i}')
                
                # Platform assignment
                station = stations[movement.from_station]
                platform_vars[i] = self.model.NewIntVar(1, station.platforms, f'platform_{i}')
                
                # Delay variables (for soft constraints)
                delay_vars[i] = self.model.NewIntVar(0, 120, f'delay_{i}')
                
                # Throughput contribution
                throughput_vars[i] = self.model.NewIntVar(0, 100, f'throughput_{i}')
            
            # Enhanced constraints
            self._add_platform_conflict_constraints(movements, departure_vars, platform_vars, stations)
            self._add_train_sequence_constraints(movements, departure_vars, trains)
            self._add_capacity_constraints(movements, departure_vars, platform_vars, stations)
            self._add_priority_constraints(movements, departure_vars, trains)
            
            # Multi-objective optimization
            objective_terms = []
            
            # 1. Delay minimization
            delay_terms = []
            for i, movement in enumerate(movements):
                train = trains[movement.train_id]
                scheduled = movement.scheduled_departure_hour
                
                # Calculate delay
                self.model.Add(delay_vars[i] >= departure_vars[i] - scheduled)
                self.model.Add(delay_vars[i] >= 0)
                
                weight = train.priority.value * objective_weights["delay_minimization"]
                delay_terms.append(weight * delay_vars[i])
            
            # 2. Throughput maximization (more trains in peak hours = higher throughput)
            throughput_terms = []
            for i, movement in enumerate(movements):
                # Peak hours (7-9 AM, 5-7 PM) get higher throughput value
                peak_bonus = self.model.NewBoolVar(f'peak_{i}')
                self.model.Add(departure_vars[i] >= 7).OnlyEnforceIf(peak_bonus)
                self.model.Add(departure_vars[i] <= 9).OnlyEnforceIf(peak_bonus)
                
                evening_peak = self.model.NewBoolVar(f'evening_peak_{i}')
                self.model.Add(departure_vars[i] >= 17).OnlyEnforceIf(evening_peak)
                self.model.Add(departure_vars[i] <= 19).OnlyEnforceIf(evening_peak)
                
                # Throughput value
                base_throughput = 10
                peak_throughput = 20
                
                self.model.Add(throughput_vars[i] == base_throughput + peak_throughput * peak_bonus + 
                              peak_throughput * evening_peak)
                
                throughput_terms.append(objective_weights["throughput_maximization"] * throughput_vars[i])
            
            # 3. Priority balancing (ensure high-priority trains get preference)
            priority_terms = []
            for i, movement in enumerate(movements):
                train = trains[movement.train_id]
                priority_weight = train.priority.value * objective_weights["priority_balancing"]
                
                # High priority trains should depart closer to scheduled time
                priority_penalty = delay_vars[i] * priority_weight
                priority_terms.append(-priority_penalty)  # Negative because we want to minimize
            
            # Combined objective
            total_objective = (
                -sum(delay_terms) +  # Minimize delays (negative for minimization)
                sum(throughput_terms) +  # Maximize throughput
                sum(priority_terms)  # Balance priorities
            )
            
            self.model.Maximize(total_objective)
            
            # Solve with time limit
            solver = cp_model.CpSolver()
            solver.parameters.max_time_in_seconds = 15.0
            solver.parameters.num_search_workers = 4  # Use multiple cores
            
            status = solver.Solve(self.model)
            
            if status in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
                return self._extract_advanced_solution(
                    movements, departure_vars, platform_vars, delay_vars, 
                    throughput_vars, solver, trains, objective_weights
                )
            else:
                return {"status": "failed", "message": "No feasible solution found"}
                
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    def _add_platform_conflict_constraints(self, movements, departure_vars, platform_vars, stations):
        """Enhanced platform conflict resolution"""
        # Group by station for more efficient constraints
        station_movements = {}
        for i, movement in enumerate(movements):
            station_id = movement.from_station
            if station_id not in station_movements:
                station_movements[station_id] = []
            station_movements[station_id].append(i)
        
        for station_id, movement_indices in station_movements.items():
            for i in range(len(movement_indices)):
                for j in range(i + 1, len(movement_indices)):
                    idx1, idx2 = movement_indices[i], movement_indices[j]
                    
                    # Same platform constraint
                    same_platform = self.model.NewBoolVar(f'same_platform_{idx1}_{idx2}')
                    self.model.Add(platform_vars[idx1] == platform_vars[idx2]).OnlyEnforceIf(same_platform)
                    self.model.Add(platform_vars[idx1] != platform_vars[idx2]).OnlyEnforceIf(same_platform.Not())
                    
                    # Time separation (minimum 1 hour for same platform)
                    time_gap = 1
                    before = self.model.NewBoolVar(f'before_{idx1}_{idx2}')
                    after = self.model.NewBoolVar(f'after_{idx1}_{idx2}')
                    
                    self.model.Add(departure_vars[idx1] + time_gap <= departure_vars[idx2]).OnlyEnforceIf([same_platform, before])
                    self.model.Add(departure_vars[idx2] + time_gap <= departure_vars[idx1]).OnlyEnforceIf([same_platform, after])
                    self.model.Add(before + after == 1).OnlyEnforceIf(same_platform)
    
    def _add_capacity_constraints(self, movements, departure_vars, platform_vars, stations):
        """Station capacity constraints"""
        for station_id, station in stations.items():
            station_movements = [i for i, m in enumerate(movements) if m.from_station == station_id]
            
            # Limit simultaneous departures per hour
            for hour in range(6, 24):
                departures_this_hour = []
                for idx in station_movements:
                    is_this_hour = self.model.NewBoolVar(f'hour_{hour}_{idx}')
                    self.model.Add(departure_vars[idx] == hour).OnlyEnforceIf(is_this_hour)
                    self.model.Add(departure_vars[idx] != hour).OnlyEnforceIf(is_this_hour.Not())
                    departures_this_hour.append(is_this_hour)
                
                # Maximum departures per hour = number of platforms
                self.model.Add(sum(departures_this_hour) <= station.platforms)
    
    def _add_priority_constraints(self, movements, departure_vars, trains):
        """Priority-based constraints"""
        # High priority trains get preference in scheduling
        high_priority_movements = []
        medium_priority_movements = []
        
        for i, movement in enumerate(movements):
            train = trains[movement.train_id]
            if train.priority.value == 3:  # HIGH
                high_priority_movements.append(i)
            elif train.priority.value == 2:  # MEDIUM
                medium_priority_movements.append(i)
        
        # High priority trains should depart closer to scheduled time
        for idx in high_priority_movements:
            movement = movements[idx]
            scheduled = movement.scheduled_departure_hour
            # Allow max 2 hours deviation for high priority
            self.model.Add(departure_vars[idx] >= scheduled - 2)
            self.model.Add(departure_vars[idx] <= scheduled + 2)
    
    def _extract_advanced_solution(self, movements, departure_vars, platform_vars, 
                                 delay_vars, throughput_vars, solver, trains, weights):
        """Extract comprehensive solution with advanced metrics"""
        solution = {
            "status": "success",
            "objective_value": solver.ObjectiveValue(),
            "movements": [],
            "advanced_metrics": {
                "optimization_weights": weights,
                "solution_quality": "optimal" if solver.OptimalityGap() == 0 else "feasible",
                "solving_time_ms": solver.WallTime(),
                "conflicts_resolved": 0,
                "throughput_score": 0,
                "priority_satisfaction": 0
            }
        }
        
        total_original_delay = sum(m.delay_minutes for m in movements)
        total_optimized_delay = 0
        conflicts_resolved = 0
        throughput_score = 0
        
        for i, movement in enumerate(movements):
            original_departure = movement.scheduled_departure_hour
            optimized_departure = solver.Value(departure_vars[i])
            original_platform = movement.platform
            optimized_platform = solver.Value(platform_vars[i])
            delay_value = solver.Value(delay_vars[i])
            throughput_value = solver.Value(throughput_vars[i])
            
            # Calculate optimized delay
            schedule_diff = optimized_departure - original_departure
            optimized_delay = max(0, movement.delay_minutes + (schedule_diff * 60))
            total_optimized_delay += optimized_delay
            
            if optimized_platform != original_platform:
                conflicts_resolved += 1
            
            throughput_score += throughput_value
            
            optimized_movement = {
                "train_id": movement.train_id,
                "from_station": movement.from_station,
                "to_station": movement.to_station,
                "original_departure": original_departure,
                "optimized_departure": optimized_departure,
                "original_platform": original_platform,
                "optimized_platform": optimized_platform,
                "original_delay": movement.delay_minutes,
                "optimized_delay": optimized_delay,
                "delay_reduction": movement.delay_minutes - optimized_delay,
                "throughput_contribution": throughput_value,
                "schedule_flexibility": abs(schedule_diff)
            }
            solution["movements"].append(optimized_movement)
        
        # Calculate advanced metrics
        improvement = ((total_original_delay - total_optimized_delay) / max(total_original_delay, 1)) * 100
        
        solution["advanced_metrics"].update({
            "total_delay_before": total_original_delay,
            "total_delay_after": total_optimized_delay,
            "improvement_percent": round(improvement, 1),
            "conflicts_resolved": conflicts_resolved,
            "throughput_score": throughput_score,
            "average_delay_reduction": round((total_original_delay - total_optimized_delay) / len(movements), 1),
            "priority_satisfaction": self._calculate_priority_satisfaction(solution["movements"], trains)
        })
        
        return solution
    
    def _calculate_priority_satisfaction(self, movements, trains):
        """Calculate how well priorities were satisfied"""
        priority_scores = []
        for movement in movements:
            train = trains[movement["train_id"]]
            delay_reduction = movement["delay_reduction"]
            priority_weight = train.priority.value
            
            # Higher priority trains should have better delay reduction
            satisfaction = min(100, max(0, delay_reduction * priority_weight))
            priority_scores.append(satisfaction)
        
        return round(np.mean(priority_scores), 1) if priority_scores else 0

# Add to main.py
advanced_optimizer = AdvancedRailwayOptimizer()

@app.post("/api/advanced-optimize")
async def advanced_optimize(request: OptimizationRequest, weights: dict = None):
    """Run advanced multi-objective optimization"""
    try:
        result = advanced_optimizer.multi_objective_optimize(request, weights)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Advanced optimization failed: {str(e)}")
