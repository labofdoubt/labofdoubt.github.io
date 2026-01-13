---
title: "Normalization-free transformers are subcritical. Part 2."
date: 2026-01-12
description: "Part 2 (draft/unlisted)."
unlisted: true
---

<!--
This post is intentionally marked `unlisted: true` so it does not appear on /blog/,
but it is still generated and reachable by direct URL: /blog/norm-free-transformers-subcritical-part-2/

Starting point: copied from `norm-free-transformers-subcritical.md`.
-->

## Overview

In my [previous blog post](/blog/norm-free-transformers-subcritical/), I demonstrated empirically that normalization-free (DyT/Derf) transformers [@zhu2025transformersnormalization; @chen2025strongernormalizationfreetransformers] have worse gradient propagation properties than the standard pre-LN transformer – namely, they exhibit much stronger gradient amplification (approximately stretched-exponential, as opposed to the power-law growth in the pre-LN baseline). Although the theoretical analysis correctly characterized the gap between the models at a qualitative level, it did not account for the attention mechanism.

In this blog post, I modify the theoretical argument by reintroducing attention, using the theoretical framework developed in [@cowsik2024geometricdynamicssignalpropagation], which restricts the initial token configurations to permutation-invariant ones. We generalize the analysis in [@cowsik2024geometricdynamicssignalpropagation] to normalization-free transformers by replacing the LayerNorms with pointwise activation functions. We show that attention does not change the mechanism that makes gradient propagation in normalization-free transformers inferior to that in pre-LN transformers. However, we can now demonstrate not only qualitative agreement between theoretical and empirical activation norms, gradients, and Jacobians, but also perfect quantitative agreement.

## Main

### Introduction

For a general introduction to the theory of signal propagation and the mean-field formalism in the large-width limit at initialization, I refer the reader to my previous blog post.

[@cowsik2024geometricdynamicssignalpropagation] observed that, for permutation-equivariant transformers (i.e., with bidirectional attention and no positional encoding), the mean-field theory at initialization effectively reduces to the layer-to-layer evolution of just two degrees of freedom, provided the initial token configuration is permutation-invariant: the component variance of the activation vector at a given position, $q^l = \frac{1}{d} h^{l}_a \cdot h^{l}_a$, and the covariance between components of activation vectors at different positions, $p^l = \frac{1}{d} h^{l}_a \cdot h^{l}_b,\ a \ne b$. Here, $h^{l}_a$ is a $d$-dimensional activation vector at layer $l$ and position $a$. Geometrically, the former is the squared norm of the activation vector at a given position, normalized by $d$, while the latter is the normalized dot product between activation vectors at different positions; consequently, $p^l/q^l$ is the cosine similarity between activation vectors at different positions.

The two main ingredients in the signal-propagation calculation at initialization are (co)variance propagation through pointwise nonlinearities and through linear layers. For the former, let us illustrate the calculation using a nonlinearity $\phi$ and two activation vectors at different positions, $h_1$ and $h_2$, whose component-wise covariance is given by
$$
\begin{equation}
\Sigma = 
\begin{pmatrix}
q & p \\
p & q 
\end{pmatrix}.
\end{equation}
$$
That is, for any component $i$ of the activation vectors, $(h_1^i, h_2^i) \sim \mathcal{N}\left(0, \Sigma\right)$, and components with different indices are uncorrelated. We then compute the $2 \times 2$ (non-centered) covariance matrix after applying the nonlinearity as
$$
\begin{equation}
\Sigma^\phi_{ab}
=
\mathbb{E}_{(h_1,\,h_2)\sim \mathcal{N}(0,\,\Sigma)}
\bigl[\phi(h_a)\,\phi(h_b)\bigr],
\qquad a,b \in \{1,2\}.
\end{equation}
$$
In this expression, each $h_a$ is a scalar dummy variable rather than a multi-component activation vector – we have simply suppressed the component index $i$. Even if the original activations have zero mean, passing through some nonlinearities (e.g., ReLU) can introduce a non-zero mean $\mathbb{E}\, \phi(h_a)$; however, it is eliminated by the subsequent linear transformation. 

A subsequent linear transformation $W$ with zero mean and variance $\sigma_W^2/d$ (assuming Gaussian weights for simplicity) multiplies the covariance by $\sigma_W^2$. Thus, combining the nonlinearity with the linear transformation yields $\bigl( [\,W\phi(h_1)\,]^i,\; [\,W\phi(h_2)\,]^i \bigr)
\sim \mathcal{N}\!\left(0,\; \sigma_W^2\,\Sigma^\phi\right)$.

### Setup

Assume a Transformer with context size $n$ has $L$ layers, alternating (bidirectional) self-attention and a position-wise MLP with ReLU activation, with residual connections. The input to each residual branch is normalized – either with LayerNorm or with a pointwise transform such as DyT/Derf. For simplicity, we assume single-head attention – in case of multi-head attention the signal propagation equations remain *exactly* identical. The dynamics of activation vectors of hidden dimension $d$ are given by the following equation:
$$
\begin{equation}
h^{l+1}_a
=
h^{l}_a
+
\begin{cases}
W_O^{l} W_V^{l} \displaystyle\sum_{b} A^{l}_{ab}\,\tilde h^{l}_{b},
& l \text{ even (attn)},\\[6pt]
W_2^{l}\,\mathrm{ReLU}\!\bigl(W_1^{l}\tilde h^{l}_{a}\bigr),
& l \text{ odd (MLP)}.
\end{cases}
\end{equation}
$$
Note that here $l=\overline{0,\, L-1}$ indexes layers (attention and MLP) rather than transformer blocks. The vectors $\tilde h^l_a$ are normalized activation vectors:
$$
\begin{equation}
\tilde h^l_a = \text{Norm}(h^l_a).
\end{equation}
$$
Here $\text{Norm}$ may be $\text{LayerNorm}$ or a pointwise transform; for example, in the case of Derf with parameter $\alpha$, $\text{Norm}(x)=\text{erf}(\alpha x)$. The attention scores $A_{ab}^l$ between the $a$-th query and the $b$-th key are computed in the standard way:
$$
\begin{equation}
A^{l}_{ab}
=
\frac{
\exp\!\left((W_Q^{l}\tilde h^{l}_{a})\cdot(W_K^{l}\tilde h^{l}_{b})/\sqrt{d}\right)
}{
\sum_{c}
\exp\!\left((W_Q^{l}\tilde  h^{l}_{a})\cdot(W_K^{l}\tilde h^{l}_{c})/\sqrt{d}\right)
}.
\end{equation}
$$

All weights are initialized from zero-mean Gaussian distributions, with variances that are shared across Transformer blocks: in the attention layer, $W_Q$, $W_K$, $W_O$, $W_V$ have component-wise variances $\sigma^2_Q/d_{in}$, $\sigma^2_K/d_{in}$, $\sigma^2_O/d_{in}$, and $\sigma^2_V/d_{in}$, respectively; in the MLP layer, $W_1$ and $W_2$ have component-wise variances $\sigma^2_1/d_{in}$ and $\sigma^2_2/d_{in}$. Here $d_{in}$ denotes the input dimension of the layer.

### Forward signal propagation

With a number of simplifying assumptions about the statistics of attention scores (see Assumption 2 in [@cowsik2024geometricdynamicssignalpropagation]), one can solve for the dynamics of $q^l$ and $p^l$:
<span id="eq-q-recursion" class="eq-anchor"></span>
$$
\begin{equation}
\begin{split}
& q^{l+1}
=
q^{l}
+
\begin{cases}
\sigma_{OV}^2\,\tilde q^{l}\,
\dfrac{
1+\dfrac{\tilde p^{l}}{\tilde q^{l}}(n-1)\exp\bigl(\sigma_{QK}^{2}\tilde q^{l}(\tilde p^{l}-\tilde q^{l})\bigr)
}{
1+(n-1)\exp \bigl(\sigma_{QK}^{2}\tilde q^{l}(\tilde p^{l}-\tilde q^{l})\bigr)
},
& l \text{ even (attn)},\\[8pt]
\dfrac{1}{2}\sigma_{21}^2\,\tilde q^{l},
& l \text{ odd (MLP)}.
\end{cases}
\end{split}
\end{equation}
$$
<span id="eq-p-recursion" class="eq-anchor"></span>
$$
\begin{equation}
\begin{split}
& p^{l+1}
=
p^{l}
+
\begin{cases}
\sigma_{OV}^2\,\tilde q^{l}\,
\dfrac{
1+\dfrac{\tilde p^{l}}{\tilde q^{l}}(n-1)\exp \bigl(\sigma_{QK}^{2}\tilde p^{l}(\tilde p^{l}-\tilde q^{l})\bigr)
}{
1+(n-1)\exp \bigl(\sigma_{QK}^{2}\tilde p^{l}(\tilde p^{l}-\tilde q^{l})\bigr)
},
& l \text{ even (attn)},\\[8pt]
\sigma_{21}^2\,\kappa\left(\tilde p^{l}/{\tilde q^{l}}\right)\tilde q^{l},
& l \text{ odd (MLP)}.
\end{cases}
\end{split}
\end{equation}
$$
For brevity, we define $\sigma_{OV}^2 = (\sigma_{O}\sigma_{V})^{2}$, $\sigma_{21}^2 = (\sigma_2 \sigma_1)^2$, and $\sigma_{QK}^2 =(\sigma_Q \sigma_K)^2$. We recall that $n$ is the context size, i.e. the number of tokens/patches. Finally, $\tilde q^l$ and $\tilde p^l$ are the covariance components after propagation through $\text{Norm}$:
$$
\begin{equation}
\tilde \Sigma_{ab}^l
=
\mathbb{E}_{(h_1,\,h_2)\sim \mathcal{N}(0,\,\Sigma^l)}
\bigl[\text{Norm}(h_a)\,\text{Norm}(h_b)\bigr],
\qquad a,b \in \{1,2\},
\end{equation}
$$
where $\Sigma^l_{11}=\Sigma^l_{22}=q^l$, $\Sigma^l_{12}=\Sigma^l_{21}=p^l$, and $\tilde\Sigma^l_{11}=\tilde\Sigma^l_{22}=\tilde q^l$, $\tilde\Sigma^l_{12}=\tilde\Sigma^l_{21}=\tilde p^l$.

The coefficients of $1/2$ and $\kappa\left(\tilde p^{l}/{\tilde q^{l}}\right)$ in the MLP expressions in Eqns. [(6)](#eq-q-recursion) and [(7)](#eq-p-recursion) arise from covariance propagation through the ReLU nonlinearity, where $\kappa$ is given by [REF?]
$$
\begin{equation}
\kappa(\rho)
=\frac{1}{2\pi}\left(\sqrt{1-\rho^{2}}+\rho\bigl(\pi-\arccos\rho\bigr)\right).
\end{equation}
$$

### Backward gradient propagation

To characterize backward gradient propagation between layers $L$ and $l$ with $L > l$, we use the Frobenius norm of the Jacobian ${J}^{L, l}=\partial h^{L}/\partial h^{l}$, averaged over weight initializations – the **APJN** (averaged partial Jacobian norm) [@doshi2023criticalinitializationwidedeep]:
$$
\begin{equation}
\mathcal{J}^{L,l}
= \frac{1}{dn}\, \mathbb{E}\!\left[\lVert J^{L,l}\rVert_F^2\right].
\end{equation}
$$
In the large-width limit, the APJN satisfies the recursion relation [@doshi2023criticalinitializationwidedeep]
<span id="eq-apjn-recursion" class="eq-anchor"></span>
$$
\begin{equation}
\mathcal{J}^{L,l}
=
\chi^{l}_{\mathcal J}\,\mathcal{J}^{L,l+1},
\qquad l < L.
\end{equation}
$$
Equivalently, $\mathcal{J}^{l+1, l_0} = \chi^l_{\mathcal{J}} \mathcal{J}^{l, l_0}$ for $l \ge l_0$. In our setup, 
<span id="eq-chi-J" class="eq-anchor"></span>
$$
\begin{equation}
\chi^l_{\mathcal J}
=
1
+
\begin{cases}
\sigma_{OV}^2\,
\dfrac{\hat q^{\,l}}{1+(n-1)\exp \bigl(\sigma_{QK}^{2}\tilde q^{l}(\tilde p^{l}-\tilde q^{l})\bigr)},
& l \text{ even (attn)},\\[6pt]
\dfrac{1}{2}\sigma_{21}^2\,\hat q^{\,l},
& l \text{ odd (MLP)}.
\end{cases}
\end{equation}
$$
Here $\hat q^l$ is the variance obtained by propagating $q^l$ through $\text{Norm}'$, where the prime denotes the derivative:
$$
\begin{equation}
\hat q^l = \mathbb{E}_{h \sim \mathcal{N}(0,\, q^l)} \text{Norm}'(h)^2.
\end{equation}
$$
This expression is somewhat vague for LayerNorm, so in that case we simply define $\hat q^l = 1/q^l$ to avoid confusion. The quantity $\hat q^l$ arises from differentiating the normalization, both for the pointwise transform and for LayerNorm.

### LayerNorm vs. Derf (theory)
We now have all the components to show that, for $\tanh$/$\text{erf}$-like normalization functions, the APJN grows approximately as a stretched-exponential, i.e. like $e^{\sqrt{l/\lambda}}$ for some parameter $\lambda$, whereas in the standard pre-LN setup it grows approximately as a power law. The general argument is identical to that in my [previous blog post](/blog/norm-free-transformers-subcritical/), so we omit the details here. The key idea is that in both cases $q^l\sim l$ for large $l$; however, for $\tanh$/$\text{erf}$-like normalization functions, $\hat q^l\sim (q^l)^{-1/2}\sim l^{-1/2}$, whereas for LayerNorm, $\hat q^l= (q^l)^{-1}\sim l^{-1}$. This yields the stated behavior of the APJN.

This conclusion remains valid in the presence of attention. In the forward pass, the linear growth of $q^l$ persists because the attention contribution is bounded. In the backward pass, since $\tilde p^l \le \tilde q^l$, the denominator in Eq. [(12)](#eq-chi-J) (attn) cannot suppress $\hat q^l$ by more than a factor of $n$. And even if it could, the MLP contribution remains the same as without attention, providing stretched-exponential growth for $\tanh$/$\text{erf}$-like normalization functions and power-law growth for LayerNorm.

In fact, for LayerNorm and Derf, the quantities $\tilde q^l$, $\tilde p^l$, and $\hat q^l$ can be computed analytically. We provide these expressions here for completeness.

$\text{Norm}=\text{LayerNorm}$:
$$
\begin{equation}
\tilde q^l = 1,\qquad \tilde p^l = p^l/q^l,\qquad \hat q^l = 1/q^l.
\end{equation}
$$
$\text{Norm}(x)=\text{Derf}_\alpha(x)=\text{erf}(\alpha x)$:
$$
\begin{equation}
\begin{aligned}
\tilde q^{\,l}
&=\frac{2}{\pi}\arcsin\!\left(\frac{2\alpha^{2}q^{l}}{1+2\alpha^{2}q^{l}}\right),
\qquad
\tilde p^{\,l}
=\frac{2}{\pi}\arcsin\!\left(\frac{2\alpha^{2}p^{l}}{1+2\alpha^{2}q^{l}}\right),
\\
\hat q^{\,l}
&=\frac{4\alpha^{2}}{\pi}\,\frac{1}{\sqrt{1+4\alpha^{2}q^{l}}}.
\end{aligned}
\end{equation}

$$

### LayerNorm vs. Derf (experiments)

<figure id="fig-vit-p-q" class="wide">
  <img src="/figures/norm-free-transformers-subcritical-part-2/meanfield_vs_vit.svg" alt="MFT vs ViT: p, q, and p/q." />
</figure>

**Figure 1.** 


<figure id="fig-vit-grads" class="wide">
  <img src="/figures/norm-free-transformers-subcritical-part-2/jacobians_and_gradients.svg" alt="MFT vs ViT: APJN and gradients." />
</figure>

**Figure 2.** 



<span id="references"></span>
## References

<div id="refs"></div>


